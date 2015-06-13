/* $Id: strformat.cpp $ */
/** @file
 * IPRT - String Formatter.
 */

/*
 * Copyright (C) 2006-2012 Oracle Corporation
 *
 * This file is part of VirtualBox Open Source Edition (OSE), as
 * available from http://www.virtualbox.org. This file is free software;
 * you can redistribute it and/or modify it under the terms of the GNU
 * General Public License (GPL) as published by the Free Software
 * Foundation, in version 2 as it comes in the "COPYING" file of the
 * VirtualBox OSE distribution. VirtualBox OSE is distributed in the
 * hope that it will be useful, but WITHOUT ANY WARRANTY of any kind.
 *
 * The contents of this file may alternatively be used under the terms
 * of the Common Development and Distribution License Version 1.0
 * (CDDL) only, as it comes in the "COPYING.CDDL" file of the
 * VirtualBox OSE distribution, in which case the provisions of the
 * CDDL are applicable instead of those of the GPL.
 *
 * You may elect to license modified versions of this file under the
 * terms and conditions of either the GPL or the CDDL or both.
 */


/*******************************************************************************
*   Defined Constants                                                          *
*******************************************************************************/
#define ISDIGIT(c) ((c) >= '0' && (c) <= '9')
/*#define MAX(a, b)  ((a) >= (b) ? (a) : (b))
#define MIN(a, b)  ((a) < (b) ? (a) : (b)) */


/*******************************************************************************
*   Header Files                                                               *
*******************************************************************************/
#define LOG_GROUP RTLOGGROUP_STRING
#include <iprt/string.h>
#include "internal/iprt.h"

#include <iprt/assert.h>
#ifdef IN_RING3
# include <iprt/alloc.h>
# include <iprt/err.h>
# include <iprt/uni.h>
#endif
#include <iprt/string.h>
#include <iprt/stdarg.h>
#include "internal/string.h"

/* Wrappers for converting to iprt facilities. */
#define SSToDS(ptr)     ptr
#define kASSERT         Assert
#define KENDIAN_LITTLE  1
#define KENDIAN         KENDIAN_LITTLE
#define KSIZE           size_t
typedef struct
{
    uint32_t    ulLo;
    uint32_t    ulHi;
} KSIZE64;


/*******************************************************************************
*   Internal Functions                                                         *
*******************************************************************************/
static unsigned _strnlen(const char *psz, unsigned cchMax);
static unsigned _strnlenUtf16(PCRTUTF16 pwsz, unsigned cchMax);
static int rtStrFormatNumber(char *psz, KSIZE64 ullValue, unsigned int uiBase, signed int cchWidth, signed int cchPrecision, unsigned int fFlags);


/**
 * Finds the length of a string up to cchMax.
 * @returns   Length.
 * @param     psz     Pointer to string.
 * @param     cchMax  Max length.
 */
static unsigned _strnlen(const char *psz, unsigned cchMax)
{
    const char *pszC = psz;

    while (cchMax-- > 0 &&  *psz != '\0')
        psz++;

    return (unsigned)(psz - pszC);
}


/**
 * Finds the length of a string up to cchMax.
 * @returns   Length.
 * @param     pwsz    Pointer to string.
 * @param     cchMax  Max length.
 */
static unsigned _strnlenUtf16(PCRTUTF16 pwsz, unsigned cchMax)
{
#ifdef IN_RING3
    unsigned cwc = 0;
    while (cchMax-- > 0)
    {
        RTUNICP cp;
        int rc = RTUtf16GetCpEx(&pwsz, &cp);
        AssertRC(rc);
        if (RT_FAILURE(rc) || !cp)
            break;
        cwc++;
    }
    return cwc;
#else   /* !IN_RING3 */
    PCRTUTF16    pwszC = pwsz;

    while (cchMax-- > 0 &&  *pwsz != '\0')
        pwsz++;

    return (unsigned)(pwsz - pwszC);
#endif  /* !IN_RING3 */
}


/**
 * Finds the length of a string up to cchMax.
 * @returns   Length.
 * @param     pusz    Pointer to string.
 * @param     cchMax  Max length.
 */
static unsigned _strnlenUni(PCRTUNICP pusz, unsigned cchMax)
{
    PCRTUNICP   puszC = pusz;

    while (cchMax-- > 0 && *pusz != '\0')
        pusz++;

    return (unsigned)(pusz - puszC);
}


/**
 * Formats an integer number according to the parameters.
 *
 * @returns   Length of the formatted number.
 * @param     psz            Pointer to output string buffer of sufficient size.
 * @param     u64Value       Value to format.
 * @param     uiBase         Number representation base.
 * @param     cchWidth       Width.
 * @param     cchPrecision   Precision.
 * @param     fFlags         Flags (NTFS_*).
 */
RTDECL(int) RTStrFormatNumber(char *psz, uint64_t u64Value, unsigned int uiBase, signed int cchWidth, signed int cchPrecision,
                              unsigned int fFlags)
{
    return rtStrFormatNumber(psz, *(KSIZE64 *)(void *)&u64Value, uiBase, cchWidth, cchPrecision, fFlags);
}
RT_EXPORT_SYMBOL(RTStrFormatNumber);



/**
 * Formats an integer number according to the parameters.
 *
 * @returns   Length of the number.
 * @param     psz            Pointer to output string.
 * @param     ullValue       Value. Using the high part is optional.
 * @param     uiBase         Number representation base.
 * @param     cchWidth       Width
 * @param     cchPrecision   Precision.
 * @param     fFlags         Flags (NTFS_*).
 */
static int rtStrFormatNumber(char *psz, KSIZE64 ullValue, unsigned int uiBase, signed int cchWidth, signed int cchPrecision,
                             unsigned int fFlags)
{
    const char     *pachDigits = "0123456789abcdef";
    char           *pszStart = psz;
    int             cchMax;
    int             cchValue;
    unsigned long   ul;
    int             i;
    int             j;

    /*
     * Validate and adjust input...
     */
    Assert(uiBase >= 2 && uiBase <= 16);
    if (fFlags & RTSTR_F_CAPITAL)
        pachDigits = "0123456789ABCDEF";
    if (fFlags & RTSTR_F_LEFT)
        fFlags &= ~RTSTR_F_ZEROPAD;
    if (    (fFlags & RTSTR_F_THOUSAND_SEP)
        &&  (   uiBase != 10
             || (fFlags & RTSTR_F_ZEROPAD))) /** @todo implement RTSTR_F_ZEROPAD + RTSTR_F_THOUSAND_SEP. */
        fFlags &= ~RTSTR_F_THOUSAND_SEP;

    /*
     * Determine value length
     */
    cchValue = 0;
    if (ullValue.ulHi || (fFlags & RTSTR_F_64BIT))
    {
        uint64_t    u64 = *(uint64_t *)(void *)&ullValue;
        if ((fFlags & RTSTR_F_VALSIGNED) && (ullValue.ulHi & 0x80000000))
            u64 = -(int64_t)u64;
        do
        {
            cchValue++;
            u64 /= uiBase;
        } while (u64);
    }
    else
    {
        ul = (fFlags & RTSTR_F_VALSIGNED) && (ullValue.ulLo & 0x80000000) ? -(int32_t)ullValue.ulLo : ullValue.ulLo;
        do
        {
            cchValue++;
            ul /= uiBase;
        } while (ul);
    }
    if (fFlags & RTSTR_F_THOUSAND_SEP)
    {
        if (cchValue <= 3)
            fFlags &= ~RTSTR_F_THOUSAND_SEP;
        else
            cchValue += cchValue / 3 - (cchValue % 3 == 0);
    }

    /*
     * Sign (+/-).
     */
    i = 0;
    if (fFlags & RTSTR_F_VALSIGNED)
    {
        if ((ullValue.ulHi || (fFlags & RTSTR_F_64BIT) ? ullValue.ulHi : ullValue.ulLo) & 0x80000000)
        {
            ullValue.ulLo = -(int32_t)ullValue.ulLo;
            if (ullValue.ulHi)
                ullValue.ulHi = ~ullValue.ulHi;
            psz[i++] = '-';
        }
        else if (fFlags & (RTSTR_F_PLUS | RTSTR_F_BLANK))
            psz[i++] = (char)(fFlags & RTSTR_F_PLUS ? '+' : ' ');
    }

    /*
     * Special (0/0x).
     */
    if ((fFlags & RTSTR_F_SPECIAL) && (uiBase % 8) == 0)
    {
        psz[i++] = '0';
        if (uiBase == 16)
            psz[i++] = (char)(fFlags & RTSTR_F_CAPITAL ? 'X' : 'x');
    }

    /*
     * width - only if ZEROPAD
     */
    cchMax    = 64 - (cchValue + i + 1);   /* HACK! 64 bytes seems to be the usual buffer size... */
    cchWidth -= i + cchValue;
    if (fFlags & RTSTR_F_ZEROPAD)
        while (--cchWidth >= 0 && i < cchMax)
        {
            AssertBreak(i < cchMax);
            psz[i++] = '0';
            cchPrecision--;
        }
    else if (!(fFlags & RTSTR_F_LEFT) && cchWidth > 0)
    {
        AssertStmt(cchWidth < cchMax, cchWidth = cchMax - 1);
        for (j = i - 1; j >= 0; j--)
            psz[cchWidth + j] = psz[j];
        for (j = 0; j < cchWidth; j++)
            psz[j] = ' ';
        i += cchWidth;
    }

    /*
     * precision
     */
    while (--cchPrecision >= cchValue)
    {
        AssertBreak(i < cchMax);
        psz[i++] = '0';
    }

    psz += i;

    /*
     * write number - not good enough but it works
     */
    psz += cchValue;
    i = -1;
    if (ullValue.ulHi || (fFlags & RTSTR_F_64BIT))
    {
        uint64_t    u64 = *(uint64_t *)(void *)&ullValue;
        if (fFlags & RTSTR_F_THOUSAND_SEP)
        {
            do
            {
                if ((-i - 1) % 4 == 3)
                    psz[i--] = ' ';
                psz[i--] = pachDigits[u64 % uiBase];
                u64 /= uiBase;
            } while (u64);
        }
        else
        {
            do
            {
                psz[i--] = pachDigits[u64 % uiBase];
                u64 /= uiBase;
            } while (u64);
        }
    }
    else
    {
        ul = (fFlags & RTSTR_F_VALSIGNED) && (ullValue.ulLo & 0x80000000) ? -(int32_t)ullValue.ulLo : ullValue.ulLo;
        if (fFlags & RTSTR_F_THOUSAND_SEP)
        {
            do
            {
                if ((-i - 1) % 4 == 3)
                    psz[i--] = ' ';
                psz[i--] = pachDigits[ul % uiBase];
                ul /= uiBase;
            } while (ul);
        }
        else
        {
            do
            {
                psz[i--] = pachDigits[ul % uiBase];
                ul /= uiBase;
            } while (ul);
        }
    }

    /*
     * width if RTSTR_F_LEFT
     */
    if (fFlags & RTSTR_F_LEFT)
        while (--cchWidth >= 0)
            *psz++ = ' ';

    *psz = '\0';
    return (unsigned)(psz - pszStart);
}


/**
 * Partial implementation of a printf like formatter.
 * It doesn't do everything correct, and there is no floating point support.
 * However, it supports custom formats by the means of a format callback.
 *
 * @returns number of bytes formatted.
 * @param   pfnOutput   Output worker.
 *                      Called in two ways. Normally with a string an it's length.
 *                      For termination, it's called with NULL for string, 0 for length.
 * @param   pvArgOutput Argument to the output worker.
 * @param   pfnFormat   Custom format worker.
 * @param   pvArgFormat Argument to the format worker.
 * @param   pszFormat   Format string.
 * @param   InArgs      Argument list.
 */
RTDECL(size_t) RTStrFormatV(PFNRTSTROUTPUT pfnOutput, void *pvArgOutput, PFNSTRFORMAT pfnFormat, void *pvArgFormat,
                            const char *pszFormat, va_list InArgs)
{
    va_list     args;
    KSIZE       cch = 0;
    const char *pszStartOutput = pszFormat;

    va_copy(args, InArgs); /* make a copy so we can reference it (AMD64 / gcc). */

    while (*pszFormat != '\0')
    {
        if (*pszFormat == '%')
        {
            /* output pending string. */
            if (pszStartOutput != pszFormat)
                cch += pfnOutput(pvArgOutput, pszStartOutput, pszFormat - pszStartOutput);

            /* skip '%' */
            pszFormat++;
            if (*pszFormat == '%')    /* '%%'-> '%' */
                pszStartOutput = pszFormat++;
            else
            {
                unsigned int fFlags = 0;
                int          cchWidth = -1;
                int          cchPrecision = -1;
                unsigned int uBase = 10;
                char         chArgSize;

                /* flags */
                for (;;)
                {
                    switch (*pszFormat++)
                    {
                        case '#':   fFlags |= RTSTR_F_SPECIAL;      continue;
                        case '-':   fFlags |= RTSTR_F_LEFT;         continue;
                        case '+':   fFlags |= RTSTR_F_PLUS;         continue;
                        case ' ':   fFlags |= RTSTR_F_BLANK;        continue;
                        case '0':   fFlags |= RTSTR_F_ZEROPAD;      continue;
                        case '\'':  fFlags |= RTSTR_F_THOUSAND_SEP; continue;
                    }
                    pszFormat--;
                    break;
                }

                /* width */
                if (ISDIGIT(*pszFormat))
                {
                    for (cchWidth = 0; ISDIGIT(*pszFormat); pszFormat++)
                    {
                        cchWidth *= 10;
                        cchWidth += *pszFormat - '0';
                    }
                    fFlags |= RTSTR_F_WIDTH;
                }
                else if (*pszFormat == '*')
                {
                    pszFormat++;
                    cchWidth = va_arg(args, int);
                    if (cchWidth < 0)
                    {
                        cchWidth = -cchWidth;
                        fFlags |= RTSTR_F_LEFT;
                    }
                    fFlags |= RTSTR_F_WIDTH;
                }

                /* precision */
                if (*pszFormat == '.')
                {
                    pszFormat++;
                    if (ISDIGIT(*pszFormat))
                    {
                        for (cchPrecision = 0; ISDIGIT(*pszFormat); pszFormat++)
                        {
                            cchPrecision *= 10;
                            cchPrecision += *pszFormat - '0';
                        }

                    }
                    else if (*pszFormat == '*')
                    {
                        pszFormat++;
                        cchPrecision = va_arg(args, int);
                    }
                    if (cchPrecision < 0)
                        cchPrecision = 0;
                    fFlags |= RTSTR_F_PRECISION;
                }

                /*
                 * Argument size.
                 */
                chArgSize = *pszFormat;
                switch (chArgSize)
                {
                    default:
                        chArgSize = 0;
                        break;

                    case 'z':
                    case 'L':
                    case 'j':
                    case 't':
                        pszFormat++;
                        break;

                    case 'l':
                        pszFormat++;
                        if (*pszFormat == 'l')
                        {
                            chArgSize = 'L';
                            pszFormat++;
                        }
                        break;

                    case 'h':
                        pszFormat++;
                        if (*pszFormat == 'h')
                        {
                            chArgSize = 'H';
                            pszFormat++;
                        }
                        break;

                    case 'I': /* Used by Win32/64 compilers. */
                        if (   pszFormat[1] == '6'
                            && pszFormat[2] == '4')
                        {
                            pszFormat += 3;
                            chArgSize = 'L';
                        }
                        else if (   pszFormat[1] == '3'
                                 && pszFormat[2] == '2')
                        {
                            pszFormat += 3;
                            chArgSize = 0;
                        }
                        else
                        {
                            pszFormat += 1;
                            chArgSize = 'j';
                        }
                        break;

                    case 'q': /* Used on BSD platforms. */
                        pszFormat++;
                        chArgSize = 'L';
                        break;
                }

                /*
                 * The type.
                 */
                switch (*pszFormat++)
                {
                    /* char */
                    case 'c':
                    {
                        char ch;

                        if (!(fFlags & RTSTR_F_LEFT))
                            while (--cchWidth > 0)
                                cch += pfnOutput(pvArgOutput, " ", 1);

                        ch = (char)va_arg(args, int);
                        cch += pfnOutput(pvArgOutput, SSToDS(&ch), 1);

                        while (--cchWidth > 0)
                            cch += pfnOutput(pvArgOutput, " ", 1);
                        break;
                    }

                    case 'S':   /* Legacy, conversion done by streams now. */
                    case 's':
                    {
                        if (chArgSize == 'l')
                        {
                            /* utf-16 -> utf-8 */
                            int         cchStr;
                            PCRTUTF16   pwszStr = va_arg(args, PRTUTF16);

                            if (!VALID_PTR(pwszStr))
                            {
                                static RTUTF16  s_wszNull[] = {'<', 'N', 'U', 'L', 'L', '>', '\0' };
                                pwszStr = s_wszNull;
                            }
                            cchStr = _strnlenUtf16(pwszStr, (unsigned)cchPrecision);
                            if (!(fFlags & RTSTR_F_LEFT))
                                while (--cchWidth >= cchStr)
                                    cch += pfnOutput(pvArgOutput, " ", 1);
                            cchWidth -= cchStr;
                            while (cchStr-- > 0)
                            {
/**@todo #ifndef IN_RC*/
#ifdef IN_RING3
                                RTUNICP Cp;
                                RTUtf16GetCpEx(&pwszStr, &Cp);
                                char szUtf8[8]; /* Cp=0x7fffffff -> 6 bytes. */
                                char *pszEnd = RTStrPutCp(szUtf8, Cp);
                                cch += pfnOutput(pvArgOutput, szUtf8, pszEnd - szUtf8);
#else
                                char ch = (char)*pwszStr++;
                                cch += pfnOutput(pvArgOutput, &ch, 1);
#endif
                            }
                            while (--cchWidth >= 0)
                                cch += pfnOutput(pvArgOutput, " ", 1);
                        }
                        else if (chArgSize == 'L')
                        {
                            /* unicp -> utf8 */
                            int         cchStr;
                            PCRTUNICP   puszStr = va_arg(args, PCRTUNICP);

                            if (!VALID_PTR(puszStr))
                            {
                                static RTUNICP s_uszNull[] = {'<', 'N', 'U', 'L', 'L', '>', '\0' };
                                puszStr = s_uszNull;
                            }
                            cchStr = _strnlenUni(puszStr, (unsigned)cchPrecision);
                            if (!(fFlags & RTSTR_F_LEFT))
                                while (--cchWidth >= cchStr)
                                    cch += pfnOutput(pvArgOutput, " ", 1);

                            cchWidth -= cchStr;
                            while (cchStr-- > 0)
                            {
/**@todo #ifndef IN_RC*/
#ifdef IN_RING3
                                char szUtf8[8]; /* Cp=0x7fffffff -> 6 bytes. */
                                char *pszEnd = RTStrPutCp(szUtf8, *puszStr++);
                                cch += pfnOutput(pvArgOutput, szUtf8, pszEnd - szUtf8);
#else
                                char ch = (char)*puszStr++;
                                cch += pfnOutput(pvArgOutput, &ch, 1);
#endif
                            }
                            while (--cchWidth >= 0)
                                cch += pfnOutput(pvArgOutput, " ", 1);
                        }
                        else
                        {
                            int   cchStr;
                            const char *pszStr = va_arg(args, char*);

                            if (!VALID_PTR(pszStr))
                                pszStr = "<NULL>";
                            cchStr = _strnlen(pszStr, (unsigned)cchPrecision);
                            if (!(fFlags & RTSTR_F_LEFT))
                                while (--cchWidth >= cchStr)
                                    cch += pfnOutput(pvArgOutput, " ", 1);

                            cch += pfnOutput(pvArgOutput, pszStr, cchStr);

                            while (--cchWidth >= cchStr)
                                cch += pfnOutput(pvArgOutput, " ", 1);
                        }
                        break;
                    }

                    /*-----------------*/
                    /* integer/pointer */
                    /*-----------------*/
                    case 'd':
                    case 'i':
                    case 'o':
                    case 'p':
                    case 'u':
                    case 'x':
                    case 'X':
                    {
                        char        achNum[64]; /* FIXME */
                        int         cchNum;
                        uint64_t    u64Value;

                        switch (pszFormat[-1])
                        {
                            case 'd': /* signed decimal integer */
                            case 'i':
                                fFlags |= RTSTR_F_VALSIGNED;
                                break;

                            case 'o':
                                uBase = 8;
                                break;

                            case 'p':
                                fFlags |= RTSTR_F_ZEROPAD; /* Note not standard behaviour (but I like it this way!) */
                                uBase = 16;
                                if (cchWidth < 0)
                                    cchWidth = sizeof(char *) * 2;
                                break;

                            case 'u':
                                uBase = 10;
                                break;

                            case 'X':
                                fFlags |= RTSTR_F_CAPITAL;
                            case 'x':
                                uBase = 16;
                                break;
                        }

                        if (pszFormat[-1] == 'p')
                            u64Value = va_arg(args, uintptr_t);
                        else if (fFlags & RTSTR_F_VALSIGNED)
                        {
                            if (chArgSize == 'L')
                            {
                                u64Value = va_arg(args, int64_t);
                                fFlags |= RTSTR_F_64BIT;
                            }
                            else if (chArgSize == 'l')
                            {
                                u64Value = va_arg(args, signed long);
                                fFlags |= RTSTR_GET_BIT_FLAG(unsigned long);
                            }
                            else if (chArgSize == 'h')
                            {
                                u64Value = va_arg(args, /* signed short */ int);
                                fFlags |= RTSTR_GET_BIT_FLAG(signed short);
                            }
                            else if (chArgSize == 'H')
                            {
                                u64Value = va_arg(args, /* int8_t */ int);
                                fFlags |= RTSTR_GET_BIT_FLAG(int8_t);
                            }
                            else if (chArgSize == 'j')
                            {
                                u64Value = va_arg(args, /*intmax_t*/ int64_t);
                                fFlags |= RTSTR_F_64BIT;
                            }
                            else if (chArgSize == 'z')
                            {
                                u64Value = va_arg(args, size_t);
                                fFlags |= RTSTR_GET_BIT_FLAG(size_t);
                            }
                            else if (chArgSize == 't')
                            {
                                u64Value = va_arg(args, ptrdiff_t);
                                fFlags |= RTSTR_GET_BIT_FLAG(ptrdiff_t);
                            }
                            else
                            {
                                u64Value = va_arg(args, signed int);
                                fFlags |= RTSTR_GET_BIT_FLAG(signed int);
                            }
                        }
                        else
                        {
                            if (chArgSize == 'L')
                            {
                                u64Value = va_arg(args, uint64_t);
                                fFlags |= RTSTR_F_64BIT;
                            }
                            else if (chArgSize == 'l')
                            {
                                u64Value = va_arg(args, unsigned long);
                                fFlags |= RTSTR_GET_BIT_FLAG(unsigned long);
                            }
                            else if (chArgSize == 'h')
                            {
                                u64Value = va_arg(args, /* unsigned short */ int);
                                fFlags |= RTSTR_GET_BIT_FLAG(unsigned short);
                            }
                            else if (chArgSize == 'H')
                            {
                                u64Value = va_arg(args, /* uint8_t */ int);
                                fFlags |= RTSTR_GET_BIT_FLAG(uint8_t);
                            }
                            else if (chArgSize == 'j')
                            {
                                u64Value = va_arg(args, /*uintmax_t*/ int64_t);
                                fFlags |= RTSTR_F_64BIT;
                            }
                            else if (chArgSize == 'z')
                            {
                                u64Value = va_arg(args, size_t);
                                fFlags |= RTSTR_GET_BIT_FLAG(size_t);
                            }
                            else if (chArgSize == 't')
                            {
                                u64Value = va_arg(args, ptrdiff_t);
                                fFlags |= RTSTR_GET_BIT_FLAG(ptrdiff_t);
                            }
                            else
                            {
                                u64Value = va_arg(args, unsigned int);
                                fFlags |= RTSTR_GET_BIT_FLAG(unsigned int);
                            }
                        }
                        cchNum = RTStrFormatNumber((char *)SSToDS(&achNum), u64Value, uBase, cchWidth, cchPrecision, fFlags);
                        cch += pfnOutput(pvArgOutput, (char *)SSToDS(&achNum), cchNum);
                        break;
                    }

                    /*
                     * Nested extensions.
                     */
                    case 'M': /* replace the format string (not stacked yet). */
                    {
                        pszStartOutput = pszFormat = va_arg(args, const char *);
                        AssertPtr(pszStartOutput);
                        break;
                    }

                    case 'N': /* real nesting. */
                    {
                        const char *pszFormatNested = va_arg(args, const char *);
                        va_list    *pArgsNested     = va_arg(args, va_list *);
                        va_list     ArgsNested;
                        va_copy(ArgsNested, *pArgsNested);
                        Assert(pszFormatNested);
                        cch += RTStrFormatV(pfnOutput, pvArgOutput, pfnFormat, pvArgFormat, pszFormatNested, ArgsNested);
                        va_end(ArgsNested);
                        break;
                    }

                    /*
                     * IPRT Extensions.
                     */
                    case 'R':
                    {
                        if (*pszFormat != '[')
                        {
                            pszFormat--;
                            cch += rtstrFormatRt(pfnOutput, pvArgOutput, &pszFormat, &args, cchWidth, cchPrecision, fFlags, chArgSize);
                        }
                        else
                        {
                            pszFormat--;
                            cch += rtstrFormatType(pfnOutput, pvArgOutput, &pszFormat, &args, cchWidth, cchPrecision, fFlags, chArgSize);
                        }
                        break;
                    }

                    /*
                     * Custom format.
                     */
                    default:
                    {
                        if (pfnFormat)
                        {
                            pszFormat--;
                            cch += pfnFormat(pvArgFormat, pfnOutput, pvArgOutput, &pszFormat, &args, cchWidth, cchPrecision, fFlags, chArgSize);
                        }
                        break;
                    }
                }
                pszStartOutput = pszFormat;
            }
        }
        else
            pszFormat++;
    }

    /* output pending string. */
    if (pszStartOutput != pszFormat)
        cch += pfnOutput(pvArgOutput, pszStartOutput, pszFormat - pszStartOutput);

    /* terminate the output */
    pfnOutput(pvArgOutput, NULL, 0);

    return cch;
}
RT_EXPORT_SYMBOL(RTStrFormatV);


/**
 * Partial implementation of a printf like formatter.
 * It doesn't do everything correct, and there is no floating point support.
 * However, it supports custom formats by the means of a format callback.
 *
 * @returns number of bytes formatted.
 * @param   pfnOutput   Output worker.
 *                      Called in two ways. Normally with a string an it's length.
 *                      For termination, it's called with NULL for string, 0 for length.
 * @param   pvArgOutput Argument to the output worker.
 * @param   pfnFormat   Custom format worker.
 * @param   pvArgFormat Argument to the format worker.
 * @param   pszFormat   Format string.
 * @param   ...         Argument list.
 */
RTDECL(size_t) RTStrFormat(PFNRTSTROUTPUT pfnOutput, void *pvArgOutput, PFNSTRFORMAT pfnFormat, void *pvArgFormat, const char *pszFormat, ...)
{
    size_t cch;
    va_list args;
    va_start(args, pszFormat);
    cch = RTStrFormatV(pfnOutput, pvArgOutput, pfnFormat, pvArgFormat, pszFormat, args);
    va_end(args);
    return cch;
}
RT_EXPORT_SYMBOL(RTStrFormat);

