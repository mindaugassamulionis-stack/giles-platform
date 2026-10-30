import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing, defaultLocale, type AppLocale } from './routing';

// Static JSON imports: traceable by Next standalone output (no dynamic fs reads).
// W12-STOREFRONT-POLISH: register every namespace consumed under src/ (same
// full-registration pattern as storefront-aura). Previously only 11 namespaces
// were wired here while components referenced filterDrawer / cartPage /
// notFound / … keys directly → MISSING_MESSAGE console errors and raw keys on live.
import ltAboutPage from '../../messages/lt/aboutPage.json';
import ltAccount from '../../messages/lt/account.json';
import ltAccountPage from '../../messages/lt/accountPage.json';
import ltAccountSecurity from '../../messages/lt/accountSecurity.json';
import ltAddressBook from '../../messages/lt/addressBook.json';
import ltAuth from '../../messages/lt/auth.json';
import ltBillingPage from '../../messages/lt/billingPage.json';
import ltBlogPage from '../../messages/lt/blogPage.json';
import ltCart from '../../messages/lt/cart.json';
import ltCartDrawer from '../../messages/lt/cartDrawer.json';
import ltCartPage from '../../messages/lt/cartPage.json';
import ltCatalog from '../../messages/lt/catalog.json';
import ltCatalogPage from '../../messages/lt/catalogPage.json';
import ltChat from '../../messages/lt/chat.json';
import ltCheckout from '../../messages/lt/checkout.json';
import ltCheckoutForm from '../../messages/lt/checkoutForm.json';
import ltCheckoutPage from '../../messages/lt/checkoutPage.json';
import ltCmsPage from '../../messages/lt/cmsPage.json';
import ltCommon from '../../messages/lt/common.json';
import ltConfirmation from '../../messages/lt/confirmation.json';
import ltContactPage from '../../messages/lt/contactPage.json';
import ltCookie from '../../messages/lt/cookie.json';
import ltErrorPage from '../../messages/lt/errorPage.json';
import ltFilterDrawer from '../../messages/lt/filterDrawer.json';
import ltFooter from '../../messages/lt/footer.json';
import ltGlobalError from '../../messages/lt/globalError.json';
import ltHome from '../../messages/lt/home.json';
import ltLegalCookies from '../../messages/lt/legalCookies.json';
import ltLegalPrivacy from '../../messages/lt/legalPrivacy.json';
import ltLegalReturns from '../../messages/lt/legalReturns.json';
import ltLegalTerms from '../../messages/lt/legalTerms.json';
import ltNav from '../../messages/lt/nav.json';
import ltNotFound from '../../messages/lt/notFound.json';
import ltOrderReceived from '../../messages/lt/orderReceived.json';
import ltOrdersPage from '../../messages/lt/ordersPage.json';
import ltProduct from '../../messages/lt/product.json';
import ltProductDetail from '../../messages/lt/productDetail.json';
import ltProductPage from '../../messages/lt/productPage.json';
import ltReturnsPage from '../../messages/lt/returnsPage.json';
import ltSciencePage from '../../messages/lt/sciencePage.json';
import ltSearch from '../../messages/lt/search.json';
import ltValueProps from '../../messages/lt/valueProps.json';
import ltWishlistPage from '../../messages/lt/wishlistPage.json';
// W22-D1: vertical namespaces (vat display, parts, tools, RFQ)
import ltVat from '../../messages/lt/vat.json';
import ltPartsPage from '../../messages/lt/partsPage.json';
import ltToolsPage from '../../messages/lt/toolsPage.json';
import ltRfqPage from '../../messages/lt/rfqPage.json';
import enAboutPage from '../../messages/en/aboutPage.json';
import enAccount from '../../messages/en/account.json';
import enAccountPage from '../../messages/en/accountPage.json';
import enAccountSecurity from '../../messages/en/accountSecurity.json';
import enAddressBook from '../../messages/en/addressBook.json';
import enAuth from '../../messages/en/auth.json';
import enBillingPage from '../../messages/en/billingPage.json';
import enBlogPage from '../../messages/en/blogPage.json';
import enCart from '../../messages/en/cart.json';
import enCartDrawer from '../../messages/en/cartDrawer.json';
import enCartPage from '../../messages/en/cartPage.json';
import enCatalog from '../../messages/en/catalog.json';
import enCatalogPage from '../../messages/en/catalogPage.json';
import enChat from '../../messages/en/chat.json';
import enCheckout from '../../messages/en/checkout.json';
import enCheckoutForm from '../../messages/en/checkoutForm.json';
import enCheckoutPage from '../../messages/en/checkoutPage.json';
import enCmsPage from '../../messages/en/cmsPage.json';
import enCommon from '../../messages/en/common.json';
import enConfirmation from '../../messages/en/confirmation.json';
import enContactPage from '../../messages/en/contactPage.json';
import enCookie from '../../messages/en/cookie.json';
import enErrorPage from '../../messages/en/errorPage.json';
import enFilterDrawer from '../../messages/en/filterDrawer.json';
import enFooter from '../../messages/en/footer.json';
import enGlobalError from '../../messages/en/globalError.json';
import enHome from '../../messages/en/home.json';
import enLegalCookies from '../../messages/en/legalCookies.json';
import enLegalPrivacy from '../../messages/en/legalPrivacy.json';
import enLegalReturns from '../../messages/en/legalReturns.json';
import enLegalTerms from '../../messages/en/legalTerms.json';
import enNav from '../../messages/en/nav.json';
import enNotFound from '../../messages/en/notFound.json';
import enOrderReceived from '../../messages/en/orderReceived.json';
import enOrdersPage from '../../messages/en/ordersPage.json';
import enProduct from '../../messages/en/product.json';
import enProductDetail from '../../messages/en/productDetail.json';
import enProductPage from '../../messages/en/productPage.json';
import enReturnsPage from '../../messages/en/returnsPage.json';
import enSciencePage from '../../messages/en/sciencePage.json';
import enSearch from '../../messages/en/search.json';
import enValueProps from '../../messages/en/valueProps.json';
import enWishlistPage from '../../messages/en/wishlistPage.json';
import enVat from '../../messages/en/vat.json';
import enPartsPage from '../../messages/en/partsPage.json';
import enToolsPage from '../../messages/en/toolsPage.json';
import enRfqPage from '../../messages/en/rfqPage.json';
import plAboutPage from '../../messages/pl/aboutPage.json';
import plAccount from '../../messages/pl/account.json';
import plAccountPage from '../../messages/pl/accountPage.json';
import plAccountSecurity from '../../messages/pl/accountSecurity.json';
import plAddressBook from '../../messages/pl/addressBook.json';
import plAuth from '../../messages/pl/auth.json';
import plBillingPage from '../../messages/pl/billingPage.json';
import plBlogPage from '../../messages/pl/blogPage.json';
import plCart from '../../messages/pl/cart.json';
import plCartDrawer from '../../messages/pl/cartDrawer.json';
import plCartPage from '../../messages/pl/cartPage.json';
import plCatalog from '../../messages/pl/catalog.json';
import plCatalogPage from '../../messages/pl/catalogPage.json';
import plChat from '../../messages/pl/chat.json';
import plCheckout from '../../messages/pl/checkout.json';
import plCheckoutForm from '../../messages/pl/checkoutForm.json';
import plCheckoutPage from '../../messages/pl/checkoutPage.json';
import plCmsPage from '../../messages/pl/cmsPage.json';
import plCommon from '../../messages/pl/common.json';
import plConfirmation from '../../messages/pl/confirmation.json';
import plContactPage from '../../messages/pl/contactPage.json';
import plCookie from '../../messages/pl/cookie.json';
import plErrorPage from '../../messages/pl/errorPage.json';
import plFilterDrawer from '../../messages/pl/filterDrawer.json';
import plFooter from '../../messages/pl/footer.json';
import plGlobalError from '../../messages/pl/globalError.json';
import plHome from '../../messages/pl/home.json';
import plLegalCookies from '../../messages/pl/legalCookies.json';
import plLegalPrivacy from '../../messages/pl/legalPrivacy.json';
import plLegalReturns from '../../messages/pl/legalReturns.json';
import plLegalTerms from '../../messages/pl/legalTerms.json';
import plNav from '../../messages/pl/nav.json';
import plNotFound from '../../messages/pl/notFound.json';
import plOrderReceived from '../../messages/pl/orderReceived.json';
import plOrdersPage from '../../messages/pl/ordersPage.json';
import plProduct from '../../messages/pl/product.json';
import plProductDetail from '../../messages/pl/productDetail.json';
import plProductPage from '../../messages/pl/productPage.json';
import plReturnsPage from '../../messages/pl/returnsPage.json';
import plSciencePage from '../../messages/pl/sciencePage.json';
import plSearch from '../../messages/pl/search.json';
import plValueProps from '../../messages/pl/valueProps.json';
import plWishlistPage from '../../messages/pl/wishlistPage.json';
import plVat from '../../messages/pl/vat.json';
import plPartsPage from '../../messages/pl/partsPage.json';
import plToolsPage from '../../messages/pl/toolsPage.json';
import plRfqPage from '../../messages/pl/rfqPage.json';
import ruAboutPage from '../../messages/ru/aboutPage.json';
import ruAccount from '../../messages/ru/account.json';
import ruAccountPage from '../../messages/ru/accountPage.json';
import ruAccountSecurity from '../../messages/ru/accountSecurity.json';
import ruAddressBook from '../../messages/ru/addressBook.json';
import ruAuth from '../../messages/ru/auth.json';
import ruBillingPage from '../../messages/ru/billingPage.json';
import ruBlogPage from '../../messages/ru/blogPage.json';
import ruCart from '../../messages/ru/cart.json';
import ruCartDrawer from '../../messages/ru/cartDrawer.json';
import ruCartPage from '../../messages/ru/cartPage.json';
import ruCatalog from '../../messages/ru/catalog.json';
import ruCatalogPage from '../../messages/ru/catalogPage.json';
import ruChat from '../../messages/ru/chat.json';
import ruCheckout from '../../messages/ru/checkout.json';
import ruCheckoutForm from '../../messages/ru/checkoutForm.json';
import ruCheckoutPage from '../../messages/ru/checkoutPage.json';
import ruCmsPage from '../../messages/ru/cmsPage.json';
import ruCommon from '../../messages/ru/common.json';
import ruConfirmation from '../../messages/ru/confirmation.json';
import ruContactPage from '../../messages/ru/contactPage.json';
import ruCookie from '../../messages/ru/cookie.json';
import ruErrorPage from '../../messages/ru/errorPage.json';
import ruFilterDrawer from '../../messages/ru/filterDrawer.json';
import ruFooter from '../../messages/ru/footer.json';
import ruGlobalError from '../../messages/ru/globalError.json';
import ruHome from '../../messages/ru/home.json';
import ruLegalCookies from '../../messages/ru/legalCookies.json';
import ruLegalPrivacy from '../../messages/ru/legalPrivacy.json';
import ruLegalReturns from '../../messages/ru/legalReturns.json';
import ruLegalTerms from '../../messages/ru/legalTerms.json';
import ruNav from '../../messages/ru/nav.json';
import ruNotFound from '../../messages/ru/notFound.json';
import ruOrderReceived from '../../messages/ru/orderReceived.json';
import ruOrdersPage from '../../messages/ru/ordersPage.json';
import ruProduct from '../../messages/ru/product.json';
import ruProductDetail from '../../messages/ru/productDetail.json';
import ruProductPage from '../../messages/ru/productPage.json';
import ruReturnsPage from '../../messages/ru/returnsPage.json';
import ruSciencePage from '../../messages/ru/sciencePage.json';
import ruSearch from '../../messages/ru/search.json';
import ruValueProps from '../../messages/ru/valueProps.json';
import ruWishlistPage from '../../messages/ru/wishlistPage.json';
import ruVat from '../../messages/ru/vat.json';
import ruPartsPage from '../../messages/ru/partsPage.json';
import ruToolsPage from '../../messages/ru/toolsPage.json';
import ruRfqPage from '../../messages/ru/rfqPage.json';

const catalogs: Record<AppLocale, Record<string, unknown>> = {
    lt: {
        aboutPage: ltAboutPage,
        account: ltAccount,
        accountPage: ltAccountPage,
        accountSecurity: ltAccountSecurity,
        addressBook: ltAddressBook,
        auth: ltAuth,
        billingPage: ltBillingPage,
        blogPage: ltBlogPage,
        cart: ltCart,
        cartDrawer: ltCartDrawer,
        cartPage: ltCartPage,
        catalog: ltCatalog,
        catalogPage: ltCatalogPage,
        chat: ltChat,
        checkout: ltCheckout,
        checkoutForm: ltCheckoutForm,
        checkoutPage: ltCheckoutPage,
        cmsPage: ltCmsPage,
        common: ltCommon,
        confirmation: ltConfirmation,
        contactPage: ltContactPage,
        cookie: ltCookie,
        errorPage: ltErrorPage,
        filterDrawer: ltFilterDrawer,
        footer: ltFooter,
        globalError: ltGlobalError,
        home: ltHome,
        legalCookies: ltLegalCookies,
        legalPrivacy: ltLegalPrivacy,
        legalReturns: ltLegalReturns,
        legalTerms: ltLegalTerms,
        nav: ltNav,
        notFound: ltNotFound,
        orderReceived: ltOrderReceived,
        ordersPage: ltOrdersPage,
        product: ltProduct,
        productDetail: ltProductDetail,
        productPage: ltProductPage,
        returnsPage: ltReturnsPage,
        sciencePage: ltSciencePage,
        search: ltSearch,
        valueProps: ltValueProps,
        wishlistPage: ltWishlistPage,
        vat: ltVat,
        partsPage: ltPartsPage,
        toolsPage: ltToolsPage,
        rfqPage: ltRfqPage,
    },
    en: {
        aboutPage: enAboutPage,
        account: enAccount,
        accountPage: enAccountPage,
        accountSecurity: enAccountSecurity,
        addressBook: enAddressBook,
        auth: enAuth,
        billingPage: enBillingPage,
        blogPage: enBlogPage,
        cart: enCart,
        cartDrawer: enCartDrawer,
        cartPage: enCartPage,
        catalog: enCatalog,
        catalogPage: enCatalogPage,
        chat: enChat,
        checkout: enCheckout,
        checkoutForm: enCheckoutForm,
        checkoutPage: enCheckoutPage,
        cmsPage: enCmsPage,
        common: enCommon,
        confirmation: enConfirmation,
        contactPage: enContactPage,
        cookie: enCookie,
        errorPage: enErrorPage,
        filterDrawer: enFilterDrawer,
        footer: enFooter,
        globalError: enGlobalError,
        home: enHome,
        legalCookies: enLegalCookies,
        legalPrivacy: enLegalPrivacy,
        legalReturns: enLegalReturns,
        legalTerms: enLegalTerms,
        nav: enNav,
        notFound: enNotFound,
        orderReceived: enOrderReceived,
        ordersPage: enOrdersPage,
        product: enProduct,
        productDetail: enProductDetail,
        productPage: enProductPage,
        returnsPage: enReturnsPage,
        sciencePage: enSciencePage,
        search: enSearch,
        valueProps: enValueProps,
        wishlistPage: enWishlistPage,
        vat: enVat,
        partsPage: enPartsPage,
        toolsPage: enToolsPage,
        rfqPage: enRfqPage,
    },
    pl: {
        aboutPage: plAboutPage,
        account: plAccount,
        accountPage: plAccountPage,
        accountSecurity: plAccountSecurity,
        addressBook: plAddressBook,
        auth: plAuth,
        billingPage: plBillingPage,
        blogPage: plBlogPage,
        cart: plCart,
        cartDrawer: plCartDrawer,
        cartPage: plCartPage,
        catalog: plCatalog,
        catalogPage: plCatalogPage,
        chat: plChat,
        checkout: plCheckout,
        checkoutForm: plCheckoutForm,
        checkoutPage: plCheckoutPage,
        cmsPage: plCmsPage,
        common: plCommon,
        confirmation: plConfirmation,
        contactPage: plContactPage,
        cookie: plCookie,
        errorPage: plErrorPage,
        filterDrawer: plFilterDrawer,
        footer: plFooter,
        globalError: plGlobalError,
        home: plHome,
        legalCookies: plLegalCookies,
        legalPrivacy: plLegalPrivacy,
        legalReturns: plLegalReturns,
        legalTerms: plLegalTerms,
        nav: plNav,
        notFound: plNotFound,
        orderReceived: plOrderReceived,
        ordersPage: plOrdersPage,
        product: plProduct,
        productDetail: plProductDetail,
        productPage: plProductPage,
        returnsPage: plReturnsPage,
        sciencePage: plSciencePage,
        search: plSearch,
        valueProps: plValueProps,
        wishlistPage: plWishlistPage,
        vat: plVat,
        partsPage: plPartsPage,
        toolsPage: plToolsPage,
        rfqPage: plRfqPage,
    },
    ru: {
        aboutPage: ruAboutPage,
        account: ruAccount,
        accountPage: ruAccountPage,
        accountSecurity: ruAccountSecurity,
        addressBook: ruAddressBook,
        auth: ruAuth,
        billingPage: ruBillingPage,
        blogPage: ruBlogPage,
        cart: ruCart,
        cartDrawer: ruCartDrawer,
        cartPage: ruCartPage,
        catalog: ruCatalog,
        catalogPage: ruCatalogPage,
        chat: ruChat,
        checkout: ruCheckout,
        checkoutForm: ruCheckoutForm,
        checkoutPage: ruCheckoutPage,
        cmsPage: ruCmsPage,
        common: ruCommon,
        confirmation: ruConfirmation,
        contactPage: ruContactPage,
        cookie: ruCookie,
        errorPage: ruErrorPage,
        filterDrawer: ruFilterDrawer,
        footer: ruFooter,
        globalError: ruGlobalError,
        home: ruHome,
        legalCookies: ruLegalCookies,
        legalPrivacy: ruLegalPrivacy,
        legalReturns: ruLegalReturns,
        legalTerms: ruLegalTerms,
        nav: ruNav,
        notFound: ruNotFound,
        orderReceived: ruOrderReceived,
        ordersPage: ruOrdersPage,
        product: ruProduct,
        productDetail: ruProductDetail,
        productPage: ruProductPage,
        returnsPage: ruReturnsPage,
        sciencePage: ruSciencePage,
        search: ruSearch,
        valueProps: ruValueProps,
        wishlistPage: ruWishlistPage,
        vat: ruVat,
        partsPage: ruPartsPage,
        toolsPage: ruToolsPage,
        rfqPage: ruRfqPage,
    },
};

export default getRequestConfig(async ({ requestLocale }) => {
    const requested = await requestLocale;
    const locale = hasLocale(routing.locales, requested) ? requested : defaultLocale;
    return { locale, messages: catalogs[locale] };
});
