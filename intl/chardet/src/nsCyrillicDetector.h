/* -*- Mode: C; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 2 -*-
 *
 * The contents of this file are subject to the Netscape Public
 * License Version 1.1 (the "License"); you may not use this file
 * except in compliance with the License. You may obtain a copy of
 * the License at http://www.mozilla.org/NPL/
 *
 * Software distributed under the License is distributed on an "AS
 * IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing
 * rights and limitations under the License.
 *
 * The Original Code is mozilla.org code.
 *
 * The Initial Developer of the Original Code is Netscape
 * Communications Corporation.  Portions created by Netscape are
 * Copyright (C) 1998 Netscape Communications Corporation. All
 * Rights Reserved.
 *
 * Contributor(s): 
 */
#ifndef nsCyrillicDetector_h__
#define nsCyrillicDetector_h__

#include "nsCyrillicClass.h"




// {2002F781-3960-11d3-B3C3-00805F8A6670}
#define NS_RU_PROBDETECTOR_CID \
{ 0x2002f781, 0x3960, 0x11d3, { 0xb3, 0xc3, 0x0, 0x80, 0x5f, 0x8a, 0x66, 0x70 } }


// {2002F782-3960-11d3-B3C3-00805F8A6670}
#define NS_UK_PROBDETECTOR_CID \
{ 0x2002f782, 0x3960, 0x11d3, { 0xb3, 0xc3, 0x0, 0x80, 0x5f, 0x8a, 0x66, 0x70 } }

// {2002F783-3960-11d3-B3C3-00805F8A6670}
#define NS_RU_STRING_PROBDETECTOR_CID \
{ 0x2002f783, 0x3960, 0x11d3, { 0xb3, 0xc3, 0x0, 0x80, 0x5f, 0x8a, 0x66, 0x70 } }

// {2002F784-3960-11d3-B3C3-00805F8A6670}
#define NS_UK_STRING_PROBDETECTOR_CID \
{ 0x2002f784, 0x3960, 0x11d3, { 0xb3, 0xc3, 0x0, 0x80, 0x5f, 0x8a, 0x66, 0x70 } }

static PRUint8 *gCyrillicCls[5] =
{
   CP1251Map,
   KOI8Map,
   ISO88595Map,
   MacCyrillicMap,
   IBM866Map
};

static const char * gRussian[5] = {
  "windows-1251", 
  "KOI8-R", 
  "ISO-8859-5", 
  "x-mac-cyrillic",
  "IBM866"
};

static const char * gUkrainian[5] = {
  "windows-1251", 
  "KOI8-U", 
  "ISO-8859-5", 
  "x-mac-ukrainian",
  "IBM866"
};

#define NUM_CYR_CHARSET 5

class nsCyrillicDetector 
{
  public:
    nsCyrillicDetector(PRUint8 aItems, 
                      PRUint8 ** aCyrillicClass, 
                      const char **aCharsets) {
      mItems = aItems;
      mCyrillicClass = aCyrillicClass;
      mCharsets = aCharsets;
      for(PRUintn i=0;i<mItems;i++)
        mProb[i] = mLastCls[i] =0;
      mDone = PR_FALSE;
    };
    virtual ~nsCyrillicDetector() {};
    virtual void HandleData(const char* aBuf, PRUint32 aLen);
    virtual void   DataEnd();
  protected:
    virtual void Report(const char* aCharset) = 0;

  private:
    PRUint8  mItems;
    PRUint8 ** mCyrillicClass;
    const char** mCharsets;
    PRUint32 mProb[NUM_CYR_CHARSET];
    PRUint8 mLastCls[NUM_CYR_CHARSET];
    PRBool  mDone;
};

class nsCyrXPCOMDetector :  
      public nsCyrillicDetector,
      public nsICharsetDetector
{
  public:
    // nsISupports interface
    NS_DECL_ISUPPORTS
    nsCyrXPCOMDetector(PRUint8 aItems, 
                      PRUint8 ** aCyrillicClass, 
                      const char **aCharsets);
    virtual ~nsCyrXPCOMDetector();
    NS_IMETHOD Init(nsICharsetDetectionObserver* aObserver);
    NS_IMETHOD DoIt(const char* aBuf, PRUint32 aLen, PRBool *oDontFeedMe);
    NS_IMETHOD Done();
  protected:
    virtual void Report(const char* aCharset);
  private:
    nsCOMPtr<nsICharsetDetectionObserver> mObserver;
};

class nsCyrXPCOMStringDetector :  
      public nsCyrillicDetector,
      public nsIStringCharsetDetector
{
  public:
    // nsISupports interface
    NS_DECL_ISUPPORTS
    nsCyrXPCOMStringDetector(PRUint8 aItems, 
                      PRUint8 ** aCyrillicClass, 
                      const char **aCharsets);
    virtual ~nsCyrXPCOMStringDetector();
    NS_IMETHOD DoIt(const char* aBuf, PRUint32 aLen, 
                     const char** oCharset, nsDetectionConfident &oConf);
  protected:
    virtual void Report(const char* aCharset);
  private:
    nsCOMPtr<nsICharsetDetectionObserver> mObserver;
    const char* mResult;
};

class nsRUProbDetector : public nsCyrXPCOMDetector
{
  public:
    nsRUProbDetector() 
      : nsCyrXPCOMDetector(5, gCyrillicCls, gRussian) {};
};

class nsRUStringProbDetector : public nsCyrXPCOMStringDetector
{
  public:
    nsRUStringProbDetector() 
      : nsCyrXPCOMStringDetector(5, gCyrillicCls, gRussian) {};
};

class nsUKProbDetector : public nsCyrXPCOMDetector
{
  public:
    nsUKProbDetector() 
      : nsCyrXPCOMDetector(5, gCyrillicCls, gUkrainian) {};
};

class nsUKStringProbDetector : public nsCyrXPCOMStringDetector
{
  public:
    nsUKStringProbDetector() 
      : nsCyrXPCOMStringDetector(5, gCyrillicCls, gUkrainian) {};
};

#endif
