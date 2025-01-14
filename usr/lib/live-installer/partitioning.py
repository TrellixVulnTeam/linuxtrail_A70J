#!/usr/bin/python
# coding: utf-8
#
from __future__ import division

import os
import re
from collections import defaultdict
from utils import getoutput, shell_exec

import gtk
import parted


(IDX_PART_PATH,
 IDX_PART_TYPE,
 IDX_PART_DESCRIPTION,
 IDX_PART_FORMAT_AS,
 IDX_PART_MOUNT_AS,
 IDX_PART_SIZE,
 IDX_PART_FREE_SPACE,
 IDX_PART_OBJECT,
 IDX_PART_DISK) = range(9)

def is_efi_supported():
    # Are we running under with efi ?
    shell_exec("modprobe efivars >/dev/null 2>&1")
    return os.path.exists("/proc/efi") or os.path.exists("/sys/firmware/efi")

def path_exists(*args):
    return os.path.exists(os.path.join(*args))

TMP_MOUNTPOINT = '/tmp/live-installer/tmpmount'
RESOURCE_DIR = '/usr/share/live-installer/'

EFI_MOUNT_POINT = '/boot/efi'
SWAP_MOUNT_POINT = 'swap'


with open(RESOURCE_DIR + 'disk-partitions.html') as f:
    DISK_TEMPLATE = f.read()
    # cut out the single partition (skeleton) block
    PARTITION_TEMPLATE = re.search('CUT_HERE([\s\S]+?)CUT_HERE', DISK_TEMPLATE, re.MULTILINE).group(1)
    # delete the skeleton from original
    DISK_TEMPLATE = DISK_TEMPLATE.replace(PARTITION_TEMPLATE, '')
    # duplicate all { or } in original CSS so they don't get interpreted as part of string formatting
    DISK_TEMPLATE = re.sub('<style>[\s\S]+?</style>', lambda match: match.group().replace('{', '{{').replace('}', '}}'), DISK_TEMPLATE)


def build_partitions(_installer):
    global installer
    installer = _installer
    installer.window.window.set_cursor(gtk.gdk.Cursor(gtk.gdk.WATCH))  # "busy" cursor
    installer.window.set_sensitive(False)
    partition_setup = PartitionSetup()
    if partition_setup.disks:
        installer._selected_disk = partition_setup.disks[0][0]
        installer.partitions_browser.load_string(partition_setup.get_html(installer._selected_disk),
                                                 'text/html', 'UTF-8', 'file:///')
    installer.wTree.get_widget("scrolled_partitions").show_all()
    installer.wTree.get_widget("treeview_disks").set_model(partition_setup)
    installer.wTree.get_widget("treeview_disks").expand_all()
    installer.window.window.set_cursor(None)
    installer.window.set_sensitive(True)

def update_html_preview(selection):
    model, row = selection.get_selected()
    try: disk = model[row][IDX_PART_DISK]
    except TypeError, IndexError: return  # no disk is selected or no disk available
    if disk != installer._selected_disk:
        installer._selected_disk = disk
        installer.partitions_browser.load_string(model.get_html(disk),
                                                 'text/html', 'UTF-8', 'file:///')

def edit_partition_dialog(widget, path, viewcol):
    ''' assign the partition ... '''
    model, iter = installer.wTree.get_widget("treeview_disks").get_selection().get_selected()
    if not iter: return
    row = model[iter]
    partition = row[IDX_PART_OBJECT]
    if (partition.partition.type != parted.PARTITION_EXTENDED and
        partition.partition.number != -1):
        dlg = PartitionDialog(row[IDX_PART_PATH],
                              row[IDX_PART_MOUNT_AS],
                              row[IDX_PART_FORMAT_AS],
                              row[IDX_PART_TYPE])
        mount_as, format_as = dlg.show()
        assign_mount_point(partition, mount_as, format_as)

def assign_mount_point(partition, mount_point, filesystem):
    # Assign it in the treeview
    model = installer.wTree.get_widget("treeview_disks").get_model()
    for disk in model:
        for part in disk.iterchildren():
            if partition == part[IDX_PART_OBJECT]:
                part[IDX_PART_MOUNT_AS] = mount_point
                filesystem = get_safe_fs(partition, mount_point, filesystem)
                part[IDX_PART_FORMAT_AS] = filesystem
            elif mount_point == part[IDX_PART_MOUNT_AS]:
                part[IDX_PART_MOUNT_AS] = ""
                part[IDX_PART_FORMAT_AS] = ""
    # Assign it in our setup
    for part in installer.setup.partitions:
        if part == partition:
            partition.mount_as, partition.format_as = mount_point, filesystem
        elif part.mount_as == mount_point:
            part.mount_as, part.format_as = '', ''
    installer.setup.print_setup()

def get_safe_fs(partition, mount_point, filesystem):
    if filesystem == '':
        for part in installer.setup.partitions:
            # [XK] TODO: don't check part.type on string
            if part == partition and part.type == _('Unknown'):
                filesystem = 'swap' if mount_point == SWAP_MOUNT_POINT else 'ext4'
                break
    return filesystem

def partitions_popup_menu(widget, event):
    if event.button != 3: return
    model, iter = installer.wTree.get_widget("treeview_disks").get_selection().get_selected()
    if not iter: return
    partition = model.get_value(iter, IDX_PART_OBJECT)
    if not partition: return
    partition_type = model.get_value(iter, IDX_PART_TYPE)
    if (partition.partition.type == parted.PARTITION_EXTENDED or
        partition.partition.number == -1 or
        "swap" in partition_type):
        return
    menu = gtk.Menu()
    menuItem = gtk.MenuItem(_("Edit"))
    menuItem.connect("activate", edit_partition_dialog, None, None)
    menu.append(menuItem)
    menuItem = gtk.SeparatorMenuItem()
    menu.append(menuItem)
    menuItem = gtk.MenuItem(_("Assign to /"))
    menuItem.connect("activate", lambda w: assign_mount_point(partition, '/', 'ext4'))
    menu.append(menuItem)
    menuItem = gtk.MenuItem(_("Assign to /home"))
    menuItem.connect("activate", lambda w: assign_mount_point(partition, '/home', ''))
    menu.append(menuItem)
    if installer.setup.gptonefi:
        menuItem = gtk.SeparatorMenuItem()
        menu.append(menuItem)
        menuItem = gtk.MenuItem(_("Assign to /boot/efi"))
        menuItem.connect("activate", lambda w: assign_mount_point(partition, EFI_MOUNT_POINT, ''))
        menu.append(menuItem)
    menu.show_all()
    menu.popup(None, None, None, event.button, event.time)

def manually_edit_partitions(widget):
    """ Edit only known disks in gparted, selected one first """
    model, iter = installer.wTree.get_widget("treeview_disks").get_selection().get_selected()
    preferred = model[iter][-1] if iter else ''  # prefer disk currently selected and show it first in gparted
    disks = ' '.join(sorted((disk for disk,desc in model.disks), key=lambda disk: disk != preferred))
    shell_exec('umount -f ' + disks)  # umount disks (if possible) so gparted works out-of-the-box
    os.popen('gparted {} &'.format(disks))

def build_grub_partitions():
    grub_model = gtk.ListStore(str)
    try: preferred = [p.partition.disk.device.path for p in installer.setup.partitions if p.mount_as == '/'][0]
    except IndexError: preferred = ''
    devices = sorted(list(d[0] for d in installer.setup.partition_setup.disks) +
                     list(filter(None, (p.name for p in installer.setup.partitions))),
                     key=lambda path: path != preferred and path)
    for p in devices: grub_model.append([p])
    installer.wTree.get_widget("combobox_grub").set_model(grub_model)
    installer.wTree.get_widget("combobox_grub").set_active(0)

class PartitionSetup(gtk.TreeStore):
    def __init__(self):
        super(PartitionSetup, self).__init__(str,  # path
                                             str,  # type (fs)
                                             str,  # description (OS)
                                             str,  # format to
                                             str,  # mount point
                                             str,  # size
                                             str,  # free space
                                             object,  # partition object
                                             str)  # disk device path
        installer.setup.partitions = []
        installer.setup.partition_setup = self
        self.html_disks, self.html_chunks = {}, defaultdict(list)
        self.full_disk_format_runonce = False

        def _get_attached_disks():
            disks = []
            exclude_devices = 'sr0 sr1 cdrom dvd'.split()
            lsblk = getoutput('lsblk -dinro TYPE,NAME,RM,SIZE,MODEL | sort -k3,2')
            for line in lsblk:
                # Don't do a full parse until we know this line describes a disk.
                type, device = line.split(" ", 1)
                if type == "disk" and device not in exclude_devices:
                    type, device, removable, size, model = line.split(" ", 4)
                    device = "/dev/" + device
                    # [XK] Exclude live boot device
                    boot_partition = getoutput("mount | grep -v loop | egrep 'medium|findiso' | awk '{print $1}'")
                    if device not in boot_partition:
                        # convert size to manufacturer's size for show, e.g. in GB, not GiB!
                        print ">>> size = '{}'".format(size)
                        size = str(int(float(size[:-1]) * (1024/1000)**'BkMGTPEZY'.index(size[-1]))) + size[-1]
                        description = '{} ({}B)'.format(model.strip(), size)
                        if int(removable):
                            description = _('Removable:') + ' ' + description
                        disks.append((device, description))
            return disks

        os.popen('mkdir -p ' + TMP_MOUNTPOINT)
        installer.setup.gptonefi = is_efi_supported()
        self.disks = _get_attached_disks()
        print 'Disks: ', self.disks
        for disk_path, disk_description in self.disks:
            disk_device = parted.getDevice(disk_path)
            try: disk = parted.Disk(disk_device)
            except Exception:
                from frontend.gtk_interface import QuestionDialog
                dialog = QuestionDialog(_("Installation Tool"),
                                        _("No partition table was found on the hard drive: {disk_description}. Do you want the installer to create a set of partitions for you? Note: This will ERASE ALL DATA present on this disk.").format(**locals()),
                                        None,
                                        installer.window)
                if not dialog: continue  # the user said No, skip this disk
                installer.window.window.set_cursor(gtk.gdk.Cursor(gtk.gdk.WATCH))
                assign_mount_format = self.full_disk_format(disk_device)
                installer.window.window.set_cursor(None)
                disk = parted.Disk(disk_device)
            disk_iter = self.append(None, (disk_description, '', '', '', '', '', '', None, disk_path))
            partitions = map(Partition,
                             sorted(filter(lambda part: part.getLength('MB') > 5,  # skip ranges <5MB
                                    set(disk.getFreeSpacePartitions() +
                                        disk.getPrimaryPartitions() +
                                        disk.getLogicalPartitions() +
                                        disk.getRaidPartitions() +
                                        disk.getLVMPartitions())),
                                    key=lambda part: part.geometry.start))
            try: # assign mount_as and format_as if disk was just auto-formatted
                for partition, (mount_as, format_as) in zip(partitions, assign_mount_format):
                    partition.mount_as = mount_as
                    partition.format_as = format_as
                del assign_mount_format
            except NameError: pass
            # Needed to fix the 1% minimum Partition.size_percent
            sum_size_percent = sum(p.size_percent for p in partitions) + .5  # .5 for good measure
            for partition in partitions:
                partition.size_percent = round(partition.size_percent / sum_size_percent * 100, 1)
                installer.setup.partitions.append(partition)
                self.append(disk_iter, (partition.name,
                                        '<span foreground="{}">{}</span>'.format(partition.color, partition.type),
                                        partition.description,
                                        partition.format_as,
                                        partition.mount_as,
                                        partition.size,
                                        partition.free_space,
                                        partition,
                                        disk_path))
            self.html_disks[disk_path] = DISK_TEMPLATE.format(PARTITIONS_HTML=''.join(PARTITION_TEMPLATE.format(p) for p in partitions))

    def get_html(self, disk):
        try:
            return self.html_disks[disk]
        except:
            return ''

    def full_disk_format(self, device):
        # Create a default partition set up
        disk_label = ('gpt' if device.getLength('B') > 2**32*.9 * device.sectorSize  # size of disk > ~2TB
                               or installer.setup.gptonefi
                            else 'msdos')
        separate_home_partition = device.getLength('GB') > 61

        # [XK] Only the first drive gets a swap, root, and/or home partition
        if self.full_disk_format_runonce:
            mkpart = (
                # (condition, mount_as, format_as, size_mb)
                # root
                (True, '', 'ext4', 0),
            )
        else:
            mkpart = (
                # (condition, mount_as, format_as, size_mb)
                # EFI
                (installer.setup.gptonefi, EFI_MOUNT_POINT, 'vfat', 300),
                # swap - equal to RAM for hibernate to work well (but capped at ~8GB)
                (True, SWAP_MOUNT_POINT, 'swap', min(8800, int(round(1.1/1024 * int(getoutput("awk '/^MemTotal/{ print $2 }' /proc/meminfo")), -2)))),
                # root
                (True, '/', 'ext4', 30000 if separate_home_partition else 0),
                # home
                (separate_home_partition, '/home', 'ext4', 0),
            )
        run_parted = lambda cmd: os.system('parted --script --align optimal {} {} ; sync'.format(device.path, cmd))
        run_parted('mklabel ' + disk_label)
        start_mb = 1
        for size_mb in map(lambda x: x[-1], filter(lambda x: x[0], mkpart)):
            end = '{}MB'.format(start_mb + size_mb) if size_mb else '100%'
            run_parted('mkpart primary {}MB {}'.format(start_mb, end))
            start_mb += size_mb
        if installer.setup.gptonefi:
            run_parted('set 1 boot on')
        elif not self.full_disk_format_runonce:
            # [XK] Set the boot flag for the root partition
            run_parted('set 2 boot on')
        # [XK] Save that the first drive has been configured
        self.full_disk_format_runonce = True
        return ((i[1], i[2]) for i in mkpart if i[0])


def to_human_readable(size):
    for unit in ' kMGTPEZY':
        if size < 1000:
            return "{:.1f} {}B".format(size, unit)
        size /= 1000


class Partition(object):
    format_as = ''
    mount_as = ''

    def __init__(self, partition):
        assert partition.type not in (parted.PARTITION_METADATA, parted.PARTITION_EXTENDED)

        self.partition = partition
        self.length = partition.getLength()
        self.size_percent = max(1, round(100*self.length/partition.disk.device.getLength(), 1))
        self.size_mb = int(partition.getLength('B')/1024/1024)
        self.size = to_human_readable(partition.getLength('B'))

        # if not normal partition with /dev/sdXN path, set its name to '' and discard it from model
        self.name = partition.path if partition.number != -1 else ''
        self.short_name = self.name.split('/')[-1]
        try:
            self.type = partition.fileSystem.type
            for fs in ('swap', 'hfs', 'ufs'):  # normalize fs variations (parted.filesystem.fileSystemType.keys())
                if fs in self.type:
                    self.type = fs
            self.style = self.type
        except AttributeError:  # non-formatted partitions
            self.type = {
                parted.PARTITION_LVM: 'LVM',
                parted.PARTITION_SWAP: 'swap',
                parted.PARTITION_RAID: 'RAID',  # Empty space on Extended partition is recognized as this
                parted.PARTITION_PALO: 'PALO',
                parted.PARTITION_PREP: 'PReP',
                parted.PARTITION_LOGICAL: _('Logical partition'),
                parted.PARTITION_EXTENDED: _('Extended partition'),
                parted.PARTITION_FREESPACE: _('Free space'),
                parted.PARTITION_HPSERVICE: 'HP Service',
                parted.PARTITION_MSFT_RESERVED: 'MSFT Reserved',
            }.get(partition.type, _('Unknown'))
            self.style = {
                parted.PARTITION_SWAP: 'swap',
                parted.PARTITION_FREESPACE: 'freespace',
            }.get(partition.type, '')

        if "swap" in self.type: self.mount_as = SWAP_MOUNT_POINT

        # identify partition's description and used space
        try:
            shell_exec('mount --read-only {} {}'.format(partition.path, TMP_MOUNTPOINT))
            size, free, self.used_percent, mount_point = getoutput("df {0} | grep '^{0}' | awk '{{print $2,$4,$5,$6}}' | tail -1".format(partition.path)).split()
        except ValueError:
            print 'WARNING: Partition {} or type {} failed to mount!'.format(partition.path, partition.type)
            self.os_fs_info, self.description, self.free_space, self.used_percent = ': '+self.type, '', '', 0
        else:
            self.size_mb = int(int(size)/1024)
            self.size = to_human_readable(int(size)*1024)  # for mountable partitions, more accurate than the getLength size above
            self.free_space = to_human_readable(int(free)*1024)  # df returns values in 1024B-blocks by default
            self.used_percent = self.used_percent.strip('%') or 0
            # [XK] Had to rewrite OS description: multiple user errors
            description = ''
            if path_exists(mount_point, 'etc/'):
                try:
                    if path_exists(mount_point, 'etc/lsb-release'):
                        description = getoutput("grep DISTRIB_DESCRIPTION %s/etc/lsb-release | awk -F'=' '{print $2}' | sed 's#\"##g'" % mount_point)
                    if description == '' and path_exists(mount_point, 'etc/os-release'):
                        description = getoutput("grep PRETTY_NAME $s/etc/os-release | awk -F'=' '{print $2}' | sed 's#\"##g'" % mount_point)
                    if description == '':
                        description = getoutput('uname -s')
                except:
                    description = 'Unix'
            if path_exists(mount_point, 'Windows/servicing/Version'):
                description = 'Windows ' + {
                    '6.4':'10',
                    '6.3':'8.1',
                    '6.2':'8',
                    '6.1':'7',
                    '6.0':'Vista',
                    '5.2':'XP Pro x64',
                    '5.1':'XP',
                    '5.0':'2000',
                    '4.9':'ME',
                    '4.1':'98',
                    '4.0':'95',
                }.get(getoutput('ls {}/Windows/servicing/Version'.format(mount_point))[:3], '')
            elif path_exists(mount_point, 'Boot/BCD'):
                description = 'Windows bootloader/recovery'
            elif path_exists(mount_point, 'Windows/System32'):
                description = 'Windows'
            if getoutput("/sbin/gdisk -l {} | awk '/ EF00 /{{print $1}}'".format(partition.disk.device.path)) == str(partition.number):
                description = 'EFI System Partition'
                self.mount_as = EFI_MOUNT_POINT
            self.description = description
            self.os_fs_info = ': {0.description} ({0.type}; {0.size}; {0.free_space})'.format(self) if description else ': ' + self.type
        finally:
            shell_exec('umount -f ' + TMP_MOUNTPOINT + ' 2>/dev/null')

        self.color = {
            # colors approximately from gparted (find matching set in usr/share/disk-partitions.html)
            'btrfs': '#f95',
            'exfat': '#070',
            'ext2':  '#39f',
            'ext3':  '#09f',
            'ext4':  '#36f',
            'fat16': '#0f0',
            'fat32': '#0c0',
            'hfs':   '#c69',
            'jfs':   '#ff6',
            'swap':  '#730',
            'ntfs':  '#396',
            'reiserfs': '#c30',
            'ufs':   '#960',
            'xfs':   '#ed8',
            'zfs':   '#c0c',
            parted.PARTITION_EXTENDED: '#bbb',
        }.get(self.type, '#bbb')

    def print_partition(self):
        print "Device: %s, format as: %s, mount as: %s" % (self.partition.path, self.format_as, self.mount_as)


class PartitionDialog(object):
    def __init__(self, path, mount_as, format_as, type):
        self.glade = RESOURCE_DIR + 'interface.glade'
        self.dTree = gtk.glade.XML(self.glade, 'dialog')
        self.window = self.dTree.get_widget("dialog")
        self.window.set_title(_("Edit partition"))
        self.dTree.get_widget("label_partition").set_markup("<b>%s</b>" % _("Device:"))
        self.dTree.get_widget("label_partition_value").set_label(path)
        self.dTree.get_widget("label_use_as").set_markup(_("Format as:"))
        self.dTree.get_widget("label_mount_point").set_markup(_("Mount point:"))
        # Build supported filesystems list
        filesystems = sorted(['', 'swap'] +
                             [fs[11:] for fs in getoutput('echo /sbin/mkfs.*').split()],
                             key=lambda x: 0 if x in ('', 'ext4') else 1 if x == 'swap' else 2)
        model = gtk.ListStore(str)
        for i in filesystems: model.append([i])
        self.dTree.get_widget("combobox_use_as").set_model(model)
        self.dTree.get_widget("combobox_use_as").set_active(filesystems.index(format_as))
        # Build list of pre-provided mountpoints
        model = gtk.ListStore(str)
        for i in " / /home /boot /boot/efi /srv /tmp swap".split(' '):
            model.append([i])
        self.dTree.get_widget("comboboxentry_mount_point").set_model(model)
        self.dTree.get_widget("comboboxentry_mount_point").child.set_text(mount_as)

    def show(self):
        self.window.run()
        self.window.hide()
        w = self.dTree.get_widget("comboboxentry_mount_point")
        mount_as = w.child.get_text().strip()
        w = self.dTree.get_widget("combobox_use_as")
        format_as = w.get_model()[w.get_active()][0]
        return mount_as, format_as
