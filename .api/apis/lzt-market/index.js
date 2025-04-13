import Oas from 'oas';
import APICore from 'api/dist/core';
import definition from './openapi.json';
class SDK {
    constructor() {
        this.spec = Oas.init(definition);
        this.core = new APICore(this.spec, 'lzt-market/1.1.59a (api/6.1.3)');
    }
    /**
     * Optionally configure various options that the SDK allows.
     *
     * @param config Object of supported SDK options and toggles.
     * @param config.timeout Override the default `fetch` request timeout of 30 seconds. This number
     * should be represented in milliseconds.
     */
    config(config) {
        this.core.setConfig(config);
    }
    /**
     * If the API you're using requires authentication you can supply the required credentials
     * through this method and the library will magically determine how they should be used
     * within your API request.
     *
     * With the exception of OpenID and MutualTLS, it supports all forms of authentication
     * supported by the OpenAPI specification.
     *
     * @example <caption>HTTP Basic auth</caption>
     * sdk.auth('username', 'password');
     *
     * @example <caption>Bearer tokens (HTTP or OAuth 2)</caption>
     * sdk.auth('myBearerToken');
     *
     * @example <caption>API Keys</caption>
     * sdk.auth('myApiKey');
     *
     * @see {@link https://spec.openapis.org/oas/v3.0.3#fixed-fields-22}
     * @see {@link https://spec.openapis.org/oas/v3.1.0#fixed-fields-22}
     * @param values Your auth credentials for the API; can specify up to two strings or numbers.
     */
    auth(...values) {
        this.core.setAuth(...values);
        return this;
    }
    /**
     * If the API you're using offers alternate server URLs, and server variables, you can tell
     * the SDK which one to use with this method. To use it you can supply either one of the
     * server URLs that are contained within the OpenAPI definition (along with any server
     * variables), or you can pass it a fully qualified URL to use (that may or may not exist
     * within the OpenAPI definition).
     *
     * @example <caption>Server URL with server variables</caption>
     * sdk.server('https://{region}.api.example.com/{basePath}', {
     *   name: 'eu',
     *   basePath: 'v14',
     * });
     *
     * @example <caption>Fully qualified server URL</caption>
     * sdk.server('https://eu.api.example.com/v14');
     *
     * @param url Server URL
     * @param variables An object of variables to replace into the server URL.
     */
    server(url, variables = {}) {
        this.core.setServer(url, variables);
    }
    /**
     * Displays a list of latest accounts.
     *
     * @summary Get Last Accounts
     * @throws FetchError<401, types.CategoryAllResponse401> Unauthorized
     */
    categoryAll(metadata) {
        return this.core.fetch('/', 'get', metadata);
    }
    /**
     * Displays a list of accounts in a specific category according to your parameters.
     *
     * @summary Steam
     * @throws FetchError<401, types.CategorySteamResponse401> Unauthorized
     */
    categorySteam(metadata) {
        return this.core.fetch('/steam', 'get', metadata);
    }
    /**
     * Displays a list of accounts in a specific category according to your parameters.
     *
     * @summary Fortnite
     * @throws FetchError<401, types.CategoryFortniteResponse401> Unauthorized
     */
    categoryFortnite(metadata) {
        return this.core.fetch('/fortnite', 'get', metadata);
    }
    /**
     * Displays a list of accounts in a specific category according to your parameters.
     *
     * @summary miHoYo
     * @throws FetchError<401, types.CategoryMihoyoResponse401> Unauthorized
     */
    categoryMihoyo(metadata) {
        return this.core.fetch('/mihoyo', 'get', metadata);
    }
    /**
     * Displays a list of accounts in a specific category according to your parameters.
     *
     * @summary Riot
     * @throws FetchError<401, types.CategoryRiotResponse401> Unauthorized
     */
    categoryRiot(metadata) {
        return this.core.fetch('/riot', 'get', metadata);
    }
    /**
     * Displays a list of accounts in a specific category according to your parameters.
     *
     * @summary Telegram
     * @throws FetchError<401, types.CategoryTelegramResponse401> Unauthorized
     */
    categoryTelegram(metadata) {
        return this.core.fetch('/telegram', 'get', metadata);
    }
    /**
     * Displays a list of accounts in a specific category according to your parameters.
     *
     * @summary Supercell
     * @throws FetchError<401, types.CategorySupercellResponse401> Unauthorized
     */
    categorySupercell(metadata) {
        return this.core.fetch('/supercell', 'get', metadata);
    }
    /**
     * Displays a list of accounts in a specific category according to your parameters.
     *
     * @summary Origin
     * @throws FetchError<401, types.CategoryOriginResponse401> Unauthorized
     */
    categoryOrigin(metadata) {
        return this.core.fetch('/origin', 'get', metadata);
    }
    /**
     * Displays a list of accounts in a specific category according to your parameters.
     *
     * @summary World of Tanks
     * @throws FetchError<401, types.CategoryWotResponse401> Unauthorized
     */
    categoryWot(metadata) {
        return this.core.fetch('/world-of-tanks', 'get', metadata);
    }
    /**
     * Displays a list of accounts in a specific category according to your parameters.
     *
     * @summary WoT Blitz
     * @throws FetchError<401, types.CategoryWotBlitzResponse401> Unauthorized
     */
    categoryWotBlitz(metadata) {
        return this.core.fetch('/wot-blitz', 'get', metadata);
    }
    /**
     * Displays a list of accounts in a specific category according to your parameters.
     *
     * @summary Gifts
     * @throws FetchError<401, types.CategoryGiftsResponse401> Unauthorized
     */
    categoryGifts(metadata) {
        return this.core.fetch('/gifts', 'get', metadata);
    }
    /**
     * Displays a list of accounts in a specific category according to your parameters.
     *
     * @summary Epic Games
     * @throws FetchError<401, types.CategoryEpicGamesResponse401> Unauthorized
     */
    categoryEpicGames(metadata) {
        return this.core.fetch('/epicgames', 'get', metadata);
    }
    /**
     * Displays a list of accounts in a specific category according to your parameters.
     *
     * @summary Escape from Tarkov
     * @throws FetchError<401, types.CategoryEscapeFromTarkovResponse401> Unauthorized
     */
    categoryEscapeFromTarkov(metadata) {
        return this.core.fetch('/escape-from-tarkov', 'get', metadata);
    }
    /**
     * Displays a list of accounts in a specific category according to your parameters.
     *
     * @summary Social Club
     * @throws FetchError<401, types.CategorySocialClubResponse401> Unauthorized
     */
    categorySocialClub(metadata) {
        return this.core.fetch('/socialclub', 'get', metadata);
    }
    /**
     * Displays a list of accounts in a specific category according to your parameters.
     *
     * @summary Uplay
     * @throws FetchError<401, types.CategoryUplayResponse401> Unauthorized
     */
    categoryUplay(metadata) {
        return this.core.fetch('/uplay', 'get', metadata);
    }
    /**
     * Displays a list of accounts in a specific category according to your parameters.
     *
     * @summary War Thunder
     * @throws FetchError<401, types.CategoryWarThunderResponse401> Unauthorized
     */
    categoryWarThunder(metadata) {
        return this.core.fetch('/war-thunder', 'get', metadata);
    }
    /**
     * Displays a list of accounts in a specific category according to your parameters.
     *
     * @summary Discord
     * @throws FetchError<401, types.CategoryDiscordResponse401> Unauthorized
     */
    categoryDiscord(metadata) {
        return this.core.fetch('/discord', 'get', metadata);
    }
    /**
     * Displays a list of accounts in a specific category according to your parameters.
     *
     * @summary TikTok
     * @throws FetchError<401, types.CategoryTikTokResponse401> Unauthorized
     */
    categoryTikTok(metadata) {
        return this.core.fetch('/tiktok', 'get', metadata);
    }
    /**
     * Displays a list of accounts in a specific category according to your parameters.
     *
     * @summary Instagram
     * @throws FetchError<401, types.CategoryInstagramResponse401> Unauthorized
     */
    categoryInstagram(metadata) {
        return this.core.fetch('/instagram', 'get', metadata);
    }
    /**
     * Displays a list of accounts in a specific category according to your parameters.
     *
     * @summary BattleNet
     * @throws FetchError<401, types.CategoryBattleNetResponse401> Unauthorized
     */
    categoryBattleNet(metadata) {
        return this.core.fetch('/battlenet', 'get', metadata);
    }
    /**
     * Displays a list of accounts in a specific category according to your parameters.
     *
     * @summary ChatGPT
     * @throws FetchError<401, types.CategoryChatGptResponse401> Unauthorized
     */
    categoryChatGPT(metadata) {
        return this.core.fetch('/chatgpt', 'get', metadata);
    }
    /**
     * Displays a list of accounts in a specific category according to your parameters.
     *
     * @summary VPN
     * @throws FetchError<401, types.CategoryVpnResponse401> Unauthorized
     */
    categoryVpn(metadata) {
        return this.core.fetch('/vpn', 'get', metadata);
    }
    /**
     * Displays a list of accounts in a specific category according to your parameters.
     *
     * @summary Cinema
     * @throws FetchError<401, types.CategoryCinemaResponse401> Unauthorized
     */
    categoryCinema(metadata) {
        return this.core.fetch('/cinema', 'get', metadata);
    }
    /**
     * Displays a list of accounts in a specific category according to your parameters.
     *
     * @summary Roblox
     * @throws FetchError<401, types.CategoryRobloxResponse401> Unauthorized
     */
    categoryRoblox(metadata) {
        return this.core.fetch('/roblox', 'get', metadata);
    }
    /**
     * Displays a list of accounts in a specific category according to your parameters.
     *
     * @summary Spotify
     * @throws FetchError<401, types.CategorySpotifyResponse401> Unauthorized
     */
    categorySpotify(metadata) {
        return this.core.fetch('/spotify', 'get', metadata);
    }
    /**
     * Displays a list of accounts in a specific category according to your parameters.
     *
     * @summary Warface
     * @throws FetchError<401, types.CategoryWarfaceResponse401> Unauthorized
     */
    categoryWarface(metadata) {
        return this.core.fetch('/warface', 'get', metadata);
    }
    /**
     * Displays a list of accounts in a specific category according to your parameters.
     *
     * @summary Minecraft
     * @throws FetchError<401, types.CategoryMinecraftResponse401> Unauthorized
     */
    categoryMinecraft(metadata) {
        return this.core.fetch('/minecraft', 'get', metadata);
    }
    /**
     * Display category list.
     *
     * @summary Get Categories
     * @throws FetchError<401, types.CategoryListResponse401> Unauthorized
     */
    categoryList(metadata) {
        return this.core.fetch('/category', 'get', metadata);
    }
    /**
     * Displays search parameters for a category.
     *
     * @summary Get Category Search Params
     * @throws FetchError<401, types.CategoryParamsResponse401> Unauthorized
     */
    categoryParams(metadata) {
        return this.core.fetch('/{categoryName}/params', 'get', metadata);
    }
    /**
     * Displays a list of games in the category.
     *
     * @summary Get Category Games
     * @throws FetchError<401, types.CategoryGamesResponse401> Unauthorized
     */
    categoryGames(metadata) {
        return this.core.fetch('/{categoryName}/games', 'get', metadata);
    }
    /**
     * Displays a list of owned accounts.
     *
     * @summary Get All Owned Accounts
     * @throws FetchError<401, types.ListOwnedResponse401> Unauthorized
     */
    listOwned(metadata) {
        return this.core.fetch('/user/items', 'get', metadata);
    }
    /**
     * Displays a list of purchased accounts.
     *
     * @summary Get All Purchased Accounts
     * @throws FetchError<401, types.ListOrdersResponse401> Unauthorized
     * @throws FetchError<403, types.ListOrdersResponse403> Error Response.
     */
    listOrders(metadata) {
        return this.core.fetch('/user/orders', 'get', metadata);
    }
    /**
     * Displays a list of favourites accounts.
     *
     * @summary Get All Favourites Accounts
     * @throws FetchError<401, types.ListFavoritesResponse401> Unauthorized
     */
    listFavorites(metadata) {
        return this.core.fetch('/fave', 'get', metadata);
    }
    /**
     * Displays a list of viewed accounts.
     *
     * @summary Get All Viewed Accounts
     * @throws FetchError<401, types.ListViewedResponse401> Unauthorized
     */
    listViewed(metadata) {
        return this.core.fetch('/viewed', 'get', metadata);
    }
    /**
     * Displays account information.
     *
     * @summary Get Account
     * @throws FetchError<401, types.ManagingGetResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingGetResponse403> Error Response.
     * @throws FetchError<404, types.ManagingGetResponse404> Error Response.
     */
    managingGet(metadata) {
        return this.core.fetch('/{itemId}', 'get', metadata);
    }
    /**
     * Deletes your account from public search. Deletion type is soft. You can restore account
     * after deletion if you want.
     *
     * @summary Delete Account
     * @throws FetchError<401, types.MangingDeleteResponse401> Unauthorized
     * @throws FetchError<403, types.MangingDeleteResponse403> Error Response.
     * @throws FetchError<404, types.MangingDeleteResponse404> Error Response.
     */
    mangingDelete(metadata) {
        return this.core.fetch('/{itemId}', 'delete', metadata);
    }
    /**
     * Create a Arbitrage.
     *
     * @summary Create Arbitrage
     * @throws FetchError<401, types.ManagingArbitrageResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingArbitrageResponse403> Error Response.
     * @throws FetchError<404, types.ManagingArbitrageResponse404> Error Response.
     */
    managingArbitrage(body, metadata) {
        return this.core.fetch('/{itemId}/claims', 'post', body, metadata);
    }
    /**
     * Bulk get up to 250 accounts.
     * You can get only your accounts or those you have purchased.
     *
     * @summary Bulk Get Accounts
     * @throws FetchError<401, types.ManagingBulkGetResponse401> Unauthorized
     */
    managingBulkGet(body) {
        return this.core.fetch('/bulk/items', 'post', body);
    }
    /**
     * Gets Account steam inventory value.
     *
     * @summary Get Account Steam Inventory Value
     * @throws FetchError<401, types.ManagingSteamInventoryValueResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingSteamInventoryValueResponse403> Error Response.
     */
    managingSteamInventoryValue(metadata) {
        return this.core.fetch('/{itemId}/inventory-value', 'get', metadata);
    }
    /**
     * Gets steam inventory value.
     * > 📘 This method is rate limited. You can send 20 requests per minute (3s delay between
     * requests)
     *
     * @summary Get Steam Inventory Value
     * @throws FetchError<401, types.ManagingSteamValueResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingSteamValueResponse403> Error Response.
     */
    managingSteamValue(metadata) {
        return this.core.fetch('/steam-value', 'get', metadata);
    }
    /**
     * Returns Steam account profile/games preview.
     *
     * @summary Get Steam HTML
     * @throws FetchError<401, types.ManagingSteamPreviewResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingSteamPreviewResponse403> Error Response.
     * @throws FetchError<404, types.ManagingSteamPreviewResponse404> Error Response.
     */
    managingSteamPreview(metadata) {
        return this.core.fetch('/{itemId}/steam-preview', 'get', metadata);
    }
    /**
     * Edits any details of account.
     *
     * @summary Edit Account
     * @throws FetchError<401, types.ManagingEditResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingEditResponse403> Error Response.
     * @throws FetchError<404, types.ManagingEditResponse404> Error Response.
     */
    managingEdit(metadata) {
        return this.core.fetch('/{itemId}/edit', 'put', metadata);
    }
    managingNote(body, metadata) {
        return this.core.fetch('/{itemId}/note-save', 'post', body, metadata);
    }
    /**
     * Update inventory value.
     *
     * @summary Update Inventory Value
     * @throws FetchError<401, types.ManagingSteamUpdateValueResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingSteamUpdateValueResponse403> Error Response.
     * @throws FetchError<404, types.ManagingSteamUpdateValueResponse404> Error Response.
     */
    managingSteamUpdateValue(metadata) {
        return this.core.fetch('/{itemId}/update-inventory', 'post', metadata);
    }
    /**
     * Bumps account in the search.
     *
     * @summary Bump Account
     * @throws FetchError<401, types.ManagingBumpResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingBumpResponse403> Error Response.
     * @throws FetchError<404, types.ManagingBumpResponse404> Error Response.
     */
    managingBump(metadata) {
        return this.core.fetch('/{itemId}/bump', 'post', metadata);
    }
    /**
     * Opens account.
     *
     * @summary Open Account
     * @throws FetchError<401, types.ManagingOpenResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingOpenResponse403> Error Response.
     * @throws FetchError<404, types.ManagingOpenResponse404> Error Response.
     */
    managingOpen(metadata) {
        return this.core.fetch('/{itemId}/open', 'post', metadata);
    }
    /**
     * Closes account.
     *
     * @summary Close Account
     * @throws FetchError<401, types.ManagingCloseResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingCloseResponse403> Error Response.
     * @throws FetchError<404, types.ManagingCloseResponse404> Error Response.
     */
    managingClose(metadata) {
        return this.core.fetch('/{itemId}/close', 'post', metadata);
    }
    /**
     * Get account image.
     *
     * @summary Get Account Image
     * @throws FetchError<401, types.ManagingImageResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingImageResponse403> Error Response.
     * @throws FetchError<404, types.ManagingImageResponse404> Error Response.
     */
    managingImage(metadata) {
        return this.core.fetch('/{itemId}/image', 'get', metadata);
    }
    /**
     * Check and buy account.
     *
     * @summary Fast Buy Account
     * @throws FetchError<401, types.PurchasingFastBuyResponse401> Unauthorized
     * @throws FetchError<403, types.PurchasingFastBuyResponse403> Error Response.
     * @throws FetchError<404, types.PurchasingFastBuyResponse404> Error Response.
     */
    purchasingFastBuy(metadata) {
        return this.core.fetch('/{itemId}/fast-buy', 'post', metadata);
    }
    /**
     * Checking account for validity.
     *
     * @summary Check Account
     * @throws FetchError<401, types.PurchasingCheckResponse401> Unauthorized
     * @throws FetchError<403, types.PurchasingCheckResponse403> Error Response.
     * @throws FetchError<404, types.PurchasingCheckResponse404> Error Response.
     */
    purchasingCheck(metadata) {
        return this.core.fetch('/{itemId}/check-account', 'post', metadata);
    }
    /**
     * Confirm buy.
     *
     * > ❗️ This method doesn't check account for validity. If you want to confirm validity
     * before buying, you should use
     * [FastBuy](https://lzt-market.readme.io/reference/purchasingfastbuy) method
     *
     * @summary Confirm Buy
     * @throws FetchError<401, types.PurchasingConfirmResponse401> Unauthorized
     * @throws FetchError<403, types.PurchasingConfirmResponse403> Error Response.
     * @throws FetchError<404, types.PurchasingConfirmResponse404> Error Response.
     */
    purchasingConfirm(metadata) {
        return this.core.fetch('/{itemId}/confirm-buy', 'post', metadata);
    }
    publishingFastSell(body, metadata) {
        return this.core.fetch('/item/fast-sell', 'post', body, metadata);
    }
    /**
     * Adds account on the market.
     *
     * Required email login data categories:
     * + 9 - Fortnite
     * + 12 - Epic games
     * + 18 - Escape from Tarkov
     *
     * @summary Add Account
     * @throws FetchError<401, types.PublishingAddResponse401> Unauthorized
     * @throws FetchError<403, types.PublishingAddResponse403> Error Response.
     */
    publishingAdd(metadata) {
        return this.core.fetch('/item/add', 'post', metadata);
    }
    publishingCheck(body, metadata) {
        return this.core.fetch('/{itemId}/goods/check', 'post', body, metadata);
    }
    /**
     * Get info about not published item. For categories, which required temporary email, you
     * will get temporary email in response.
     *
     * @summary Get Temporary Mail
     * @throws FetchError<401, types.PublishingMailResponse401> Unauthorized
     * @throws FetchError<403, types.PublishingMailResponse403> Error Response.
     * @throws FetchError<404, types.PublishingMailResponse404> Error Response.
     */
    publishingMail(metadata) {
        return this.core.fetch('/{itemId}/goods/add', 'get', metadata);
    }
    /**
     * Gets confirmation code or link.
     *
     * @summary Get Email Confirmation Code
     * @throws FetchError<401, types.ManagingEmailCodeResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingEmailCodeResponse403> Error Response.
     * @throws FetchError<404, types.ManagingEmailCodeResponse404> Error Response.
     */
    managingEmailCode(metadata) {
        return this.core.fetch('/email-code', 'get', metadata);
    }
    /**
     * Returns steam mafile.
     * > ❗️ This action is cancelling active account guarantee
     *
     * @summary Get Mafile
     * @throws FetchError<401, types.ManagingSteamMafileResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingSteamMafileResponse403> Error Response.
     * @throws FetchError<404, types.ManagingSteamMafileResponse404> Error Response.
     */
    managingSteamMafile(metadata) {
        return this.core.fetch('/{itemId}/mafile', 'get', metadata);
    }
    /**
     * Remove steam mafile.
     * > ❗️ This will unlink the authenticator from the account and remove mafile from the item
     *
     * @summary Remove Mafile
     * @throws FetchError<401, types.ManagingSteamRemoveMafileResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingSteamRemoveMafileResponse403> Error Response.
     * @throws FetchError<404, types.ManagingSteamRemoveMafileResponse404> Error Response.
     */
    managingSteamRemoveMafile(metadata) {
        return this.core.fetch('/{itemId}/mafile', 'delete', metadata);
    }
    /**
     * Gets confirmation code from MaFile (Only for Steam accounts).
     *
     * @summary Get Mafile Confirmation Code
     * @throws FetchError<401, types.ManagingSteamMafileCodeResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingSteamMafileCodeResponse403> Error Response.
     * @throws FetchError<404, types.ManagingSteamMafileCodeResponse404> Error Response.
     */
    managingSteamMafileCode(metadata) {
        return this.core.fetch('/{itemId}/guard-code', 'get', metadata);
    }
    /**
     * Confirm steam action.
     *
     *  Don't set **id** and **nonce** parameters to get list of available confirmation
     * requests.
     *
     * > ❗️ This action is cancelling active account guarantee
     *
     * @summary Confirm SDA
     * @throws FetchError<401, types.ManagingSteamSdaResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingSteamSdaResponse403> Error Response.
     * @throws FetchError<404, types.ManagingSteamSdaResponse404> Error Response.
     */
    managingSteamSDA(metadata) {
        return this.core.fetch('/{itemId}/confirm-sda', 'post', metadata);
    }
    /**
     * Gets confirmation code from Telegram.
     *
     * @summary Get Telegram Confirmation Code
     * @throws FetchError<401, types.ManagingTelegramCodeResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingTelegramCodeResponse403> Error Response.
     * @throws FetchError<404, types.ManagingTelegramCodeResponse404> Error Response.
     */
    managingTelegramCode(metadata) {
        return this.core.fetch('/{itemId}/telegram-login-code', 'get', metadata);
    }
    /**
     * Resets Telegram authorizations.
     *
     * @summary Telegram Reset Auth
     * @throws FetchError<401, types.ManagingTelegramResetAuthResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingTelegramResetAuthResponse403> Error Response.
     * @throws FetchError<404, types.ManagingTelegramResetAuthResponse404> Error Response.
     */
    managingTelegramResetAuth(metadata) {
        return this.core.fetch('/{itemId}/telegram-reset-authorizations', 'post', metadata);
    }
    /**
     * Cancel guarantee of account. It can be useful for account reselling.
     *
     * @summary Cancel Guarantee
     * @throws FetchError<401, types.ManagingRefuseGuaranteeResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingRefuseGuaranteeResponse403> Error Response.
     * @throws FetchError<404, types.ManagingRefuseGuaranteeResponse404> Error Response.
     */
    managingRefuseGuarantee(metadata) {
        return this.core.fetch('/{itemId}/refuse-guarantee', 'post', metadata);
    }
    /**
     * Checks the guarantee and cancels it if there are reasons to cancel it.
     *
     * @summary Check Guarantee
     * @throws FetchError<401, types.ManagingCheckGuaranteeResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingCheckGuaranteeResponse403> Error Response.
     * @throws FetchError<404, types.ManagingCheckGuaranteeResponse404> Error Response.
     */
    managingCheckGuarantee(metadata) {
        return this.core.fetch('/{itemId}/check-guarantee', 'post', metadata);
    }
    /**
     * Changes password of account.
     *
     * @summary Change Password
     * @throws FetchError<401, types.ManagingChangePasswordResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingChangePasswordResponse403> Error Response.
     * @throws FetchError<404, types.ManagingChangePasswordResponse404> Error Response.
     */
    managingChangePassword(metadata) {
        return this.core.fetch('/{itemId}/change-password', 'post', metadata);
    }
    /**
     * Gets password from temp email of account. After calling of this method, the warranty
     * will be cancelled and you cannot automatically resell account.
     *
     * @summary Get Temp Email Password
     * @throws FetchError<401, types.ManagingTempEmailPasswordResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingTempEmailPasswordResponse403> Error Response.
     * @throws FetchError<404, types.ManagingTempEmailPasswordResponse404> Error Response.
     */
    managingTempEmailPassword(metadata) {
        return this.core.fetch('/{itemId}/temp-email-password', 'get', metadata);
    }
    /**
     * Adds tag for the account.
     *
     * @summary Tag Account
     * @throws FetchError<401, types.ManagingTagResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingTagResponse403> Error Response.
     * @throws FetchError<404, types.ManagingTagResponse404> Error Response.
     */
    managingTag(metadata) {
        return this.core.fetch('/{itemId}/tag', 'post', metadata);
    }
    /**
     * Deletes tag from the account.
     *
     * @summary Untag Account
     * @throws FetchError<401, types.ManagingUntagResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingUntagResponse403> Error Response.
     * @throws FetchError<404, types.ManagingUntagResponse404> Error Response.
     */
    managingUntag(metadata) {
        return this.core.fetch('/{itemId}/tag', 'delete', metadata);
    }
    /**
     * Adds account to favorites.
     *
     * @summary Favorite
     * @throws FetchError<401, types.ManagingFavoriteResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingFavoriteResponse403> Error Response.
     * @throws FetchError<404, types.ManagingFavoriteResponse404> Error Response.
     */
    managingFavorite(metadata) {
        return this.core.fetch('/{itemId}/star', 'post', metadata);
    }
    /**
     * Delete account from favorites.
     *
     * @summary Unfavorite
     * @throws FetchError<401, types.ManagingUnfavoriteResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingUnfavoriteResponse403> Error Response.
     * @throws FetchError<404, types.ManagingUnfavoriteResponse404> Error Response.
     */
    managingUnfavorite(metadata) {
        return this.core.fetch('/{itemId}/star', 'delete', metadata);
    }
    /**
     * Stick account in the top of search.
     *
     * @summary Stick Account
     * @throws FetchError<401, types.ManagingStickResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingStickResponse403> Error Response.
     * @throws FetchError<404, types.ManagingStickResponse404> Error Response.
     */
    managingStick(metadata) {
        return this.core.fetch('/{itemId}/stick', 'post', metadata);
    }
    /**
     * Unstick account from the top of search.
     *
     * @summary Unstick Account
     * @throws FetchError<401, types.ManagingUnstickResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingUnstickResponse403> Error Response.
     * @throws FetchError<404, types.ManagingUnstickResponse404> Error Response.
     */
    managingUnstick(metadata) {
        return this.core.fetch('/{itemId}/stick', 'delete', metadata);
    }
    /**
     * Transfer account to another user.
     *
     * @summary Change Account Owner
     * @throws FetchError<401, types.ManagingTransferResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingTransferResponse403> Error Response.
     * @throws FetchError<404, types.ManagingTransferResponse404> Error Response.
     */
    managingTransfer(metadata) {
        return this.core.fetch('/{itemId}/change-owner', 'post', metadata);
    }
    /**
     * Displays info about your profile.
     *
     * @summary Get Profile
     * @throws FetchError<401, types.ProfileGetResponse401> Unauthorized
     */
    profileGet() {
        return this.core.fetch('/me', 'get');
    }
    /**
     * Change settings about your profile on the market.
     *
     * @summary Edit Market Settings
     * @throws FetchError<401, types.ProfileEditResponse401> Unauthorized
     */
    profileEdit(metadata) {
        return this.core.fetch('/me', 'put', metadata);
    }
    /**
     * Get invoice.
     *
     * Required scopes:
     * + **invoice**
     *
     * @summary Get invoice
     * @throws FetchError<401, types.PaymentsInvoiceGetResponse401> Unauthorized
     * @throws FetchError<404, types.PaymentsInvoiceGetResponse404> Invoice Not Found
     */
    paymentsInvoiceGet(metadata) {
        return this.core.fetch('/invoice', 'get', metadata);
    }
    /**
     * Create invoice.
     *
     * Required scopes:
     * + **invoice**
     *
     * @summary Create invoice
     * @throws FetchError<401, types.PaymentsInvoiceCreateResponse401> Unauthorized
     */
    paymentsInvoiceCreate(metadata) {
        return this.core.fetch('/invoice', 'post', metadata);
    }
    /**
     * Get invoice list.
     *
     * Required scopes:
     * + **invoice**
     *
     * @summary Get invoice list
     * @throws FetchError<401, types.PaymentsInvoiceListResponse401> Unauthorized
     */
    paymentsInvoiceList(metadata) {
        return this.core.fetch('/invoice/list', 'get', metadata);
    }
    /**
     * Get currency list.
     *
     * @summary Get Currency
     * @throws FetchError<401, types.PaymentsCurrencyResponse401> Unauthorized
     */
    paymentsCurrency() {
        return this.core.fetch('/currency', 'get');
    }
    /**
     * Transfer money to any user.
     *
     * The web version additionally has a **redirect** parameter (After payment, there will be
     * a redirect to the specified link).
     *
     * @summary Transfer Money
     * @throws FetchError<401, types.PaymentsTransferResponse401> Unauthorized
     * @throws FetchError<403, types.PaymentsTransferResponse403> Error Response.
     * @throws FetchError<404, types.PaymentsTransferResponse404> Error Response.
     */
    paymentsTransfer(metadata) {
        return this.core.fetch('/balance/transfer', 'post', metadata);
    }
    /**
     * Get transfer limits and get fee amount for transfer.
     *
     * @summary Check Transfer Fee
     * @throws FetchError<401, types.PaymentsFeeResponse401> Unauthorized
     */
    paymentsFee(metadata) {
        return this.core.fetch('/balance/transfer/fee', 'get', metadata);
    }
    /**
     * Cancels a transfer with a hold that was sent to your account.
     *
     * @summary Cancel Transfer
     * @throws FetchError<401, types.PaymentsCancelResponse401> Unauthorized
     * @throws FetchError<403, types.PaymentsCancelResponse403> Error Response.
     * @throws FetchError<404, types.PaymentsCancelResponse404> Error Response.
     */
    paymentsCancel(metadata) {
        return this.core.fetch('/balance/transfer/cancel', 'post', metadata);
    }
    /**
     * Displays list of your payments.
     *
     * Required scopes:
     * + **payment**
     *
     * @summary Payments History
     * @throws FetchError<401, types.PaymentsHistoryResponse401> Unauthorized
     * @throws FetchError<403, types.PaymentsHistoryResponse403> Error Response.
     */
    paymentsHistory(metadata) {
        return this.core.fetch('/user/payments', 'get', metadata);
    }
    /**
     * Gets your proxy list.
     *
     * @summary Get Proxy
     * @throws FetchError<401, types.ProxyGetResponse401> Unauthorized
     */
    proxyGet() {
        return this.core.fetch('/proxy', 'get');
    }
    /**
     * Add single proxy or proxy list.
     *
     *
     * To add single proxy use this parameters:
     *
     *
     * + **proxy_ip** (required) - proxy ip or host
     * + **proxy_port** (required) - proxy port
     * + **proxy_user** (optional) - proxy username
     * + **proxy_pass** (optional) - proxy password
     *
     * To add proxy list use this parameters:
     *
     *
     * + **proxy_row** (required) - proxy list in String format ip:port:user:pass. Each proxy
     * must be start with new line (use \n separator)
     *
     * @summary Add Proxy
     * @throws FetchError<400, types.ProxyAddResponse400> Error Response.
     * @throws FetchError<401, types.ProxyAddResponse401> Unauthorized
     */
    proxyAdd(metadata) {
        return this.core.fetch('/proxy', 'post', metadata);
    }
    /**
     * Delete single or all proxies.
     *
     * @summary Delete Proxy
     * @throws FetchError<401, types.ProxyDeleteResponse401> Unauthorized
     * @throws FetchError<403, types.ProxyDeleteResponse403> Error Response.
     * @throws FetchError<404, types.ProxyDeleteResponse404> Proxy Not Found.
     */
    proxyDelete(metadata) {
        return this.core.fetch('/proxy', 'delete', metadata);
    }
    /**
     * Execute multiple API requests at once (Separated by comma). Maximum batch jobs is 10.
     *
     * @summary Batch
     * @throws FetchError<400, types.BatchResponse400> Error Response.
     * @throws FetchError<401, types.BatchResponse401> Unauthorized
     */
    batch(body) {
        return this.core.fetch('/batch', 'post', body);
    }
}
const createSDK = (() => { return new SDK(); })();
export default createSDK;
