import type * as types from './types';
import type { ConfigOptions, FetchResponse } from 'api/dist/core';
import Oas from 'oas';
import APICore from 'api/dist/core';
declare class SDK {
    spec: Oas;
    core: APICore;
    constructor();
    /**
     * Optionally configure various options that the SDK allows.
     *
     * @param config Object of supported SDK options and toggles.
     * @param config.timeout Override the default `fetch` request timeout of 30 seconds. This number
     * should be represented in milliseconds.
     */
    config(config: ConfigOptions): void;
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
    auth(...values: string[] | number[]): this;
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
    server(url: string, variables?: {}): void;
    /**
     * Displays a list of latest accounts.
     *
     * @summary Get Last Accounts
     * @throws FetchError<401, types.CategoryAllResponse401> Unauthorized
     */
    categoryAll(metadata?: types.CategoryAllMetadataParam): Promise<FetchResponse<200, types.CategoryAllResponse200>>;
    /**
     * Displays a list of accounts in a specific category according to your parameters.
     *
     * @summary Steam
     * @throws FetchError<401, types.CategorySteamResponse401> Unauthorized
     */
    categorySteam(metadata?: types.CategorySteamMetadataParam): Promise<FetchResponse<200, types.CategorySteamResponse200>>;
    /**
     * Displays a list of accounts in a specific category according to your parameters.
     *
     * @summary Fortnite
     * @throws FetchError<401, types.CategoryFortniteResponse401> Unauthorized
     */
    categoryFortnite(metadata?: types.CategoryFortniteMetadataParam): Promise<FetchResponse<200, types.CategoryFortniteResponse200>>;
    /**
     * Displays a list of accounts in a specific category according to your parameters.
     *
     * @summary miHoYo
     * @throws FetchError<401, types.CategoryMihoyoResponse401> Unauthorized
     */
    categoryMihoyo(metadata?: types.CategoryMihoyoMetadataParam): Promise<FetchResponse<200, types.CategoryMihoyoResponse200>>;
    /**
     * Displays a list of accounts in a specific category according to your parameters.
     *
     * @summary Riot
     * @throws FetchError<401, types.CategoryRiotResponse401> Unauthorized
     */
    categoryRiot(metadata?: types.CategoryRiotMetadataParam): Promise<FetchResponse<200, types.CategoryRiotResponse200>>;
    /**
     * Displays a list of accounts in a specific category according to your parameters.
     *
     * @summary Telegram
     * @throws FetchError<401, types.CategoryTelegramResponse401> Unauthorized
     */
    categoryTelegram(metadata?: types.CategoryTelegramMetadataParam): Promise<FetchResponse<200, types.CategoryTelegramResponse200>>;
    /**
     * Displays a list of accounts in a specific category according to your parameters.
     *
     * @summary Supercell
     * @throws FetchError<401, types.CategorySupercellResponse401> Unauthorized
     */
    categorySupercell(metadata?: types.CategorySupercellMetadataParam): Promise<FetchResponse<200, types.CategorySupercellResponse200>>;
    /**
     * Displays a list of accounts in a specific category according to your parameters.
     *
     * @summary Origin
     * @throws FetchError<401, types.CategoryOriginResponse401> Unauthorized
     */
    categoryOrigin(metadata?: types.CategoryOriginMetadataParam): Promise<FetchResponse<200, types.CategoryOriginResponse200>>;
    /**
     * Displays a list of accounts in a specific category according to your parameters.
     *
     * @summary World of Tanks
     * @throws FetchError<401, types.CategoryWotResponse401> Unauthorized
     */
    categoryWot(metadata?: types.CategoryWotMetadataParam): Promise<FetchResponse<200, types.CategoryWotResponse200>>;
    /**
     * Displays a list of accounts in a specific category according to your parameters.
     *
     * @summary WoT Blitz
     * @throws FetchError<401, types.CategoryWotBlitzResponse401> Unauthorized
     */
    categoryWotBlitz(metadata?: types.CategoryWotBlitzMetadataParam): Promise<FetchResponse<200, types.CategoryWotBlitzResponse200>>;
    /**
     * Displays a list of accounts in a specific category according to your parameters.
     *
     * @summary Gifts
     * @throws FetchError<401, types.CategoryGiftsResponse401> Unauthorized
     */
    categoryGifts(metadata?: types.CategoryGiftsMetadataParam): Promise<FetchResponse<200, types.CategoryGiftsResponse200>>;
    /**
     * Displays a list of accounts in a specific category according to your parameters.
     *
     * @summary Epic Games
     * @throws FetchError<401, types.CategoryEpicGamesResponse401> Unauthorized
     */
    categoryEpicGames(metadata?: types.CategoryEpicGamesMetadataParam): Promise<FetchResponse<200, types.CategoryEpicGamesResponse200>>;
    /**
     * Displays a list of accounts in a specific category according to your parameters.
     *
     * @summary Escape from Tarkov
     * @throws FetchError<401, types.CategoryEscapeFromTarkovResponse401> Unauthorized
     */
    categoryEscapeFromTarkov(metadata?: types.CategoryEscapeFromTarkovMetadataParam): Promise<FetchResponse<200, types.CategoryEscapeFromTarkovResponse200>>;
    /**
     * Displays a list of accounts in a specific category according to your parameters.
     *
     * @summary Social Club
     * @throws FetchError<401, types.CategorySocialClubResponse401> Unauthorized
     */
    categorySocialClub(metadata?: types.CategorySocialClubMetadataParam): Promise<FetchResponse<200, types.CategorySocialClubResponse200>>;
    /**
     * Displays a list of accounts in a specific category according to your parameters.
     *
     * @summary Uplay
     * @throws FetchError<401, types.CategoryUplayResponse401> Unauthorized
     */
    categoryUplay(metadata?: types.CategoryUplayMetadataParam): Promise<FetchResponse<200, types.CategoryUplayResponse200>>;
    /**
     * Displays a list of accounts in a specific category according to your parameters.
     *
     * @summary War Thunder
     * @throws FetchError<401, types.CategoryWarThunderResponse401> Unauthorized
     */
    categoryWarThunder(metadata?: types.CategoryWarThunderMetadataParam): Promise<FetchResponse<200, types.CategoryWarThunderResponse200>>;
    /**
     * Displays a list of accounts in a specific category according to your parameters.
     *
     * @summary Discord
     * @throws FetchError<401, types.CategoryDiscordResponse401> Unauthorized
     */
    categoryDiscord(metadata?: types.CategoryDiscordMetadataParam): Promise<FetchResponse<200, types.CategoryDiscordResponse200>>;
    /**
     * Displays a list of accounts in a specific category according to your parameters.
     *
     * @summary TikTok
     * @throws FetchError<401, types.CategoryTikTokResponse401> Unauthorized
     */
    categoryTikTok(metadata?: types.CategoryTikTokMetadataParam): Promise<FetchResponse<200, types.CategoryTikTokResponse200>>;
    /**
     * Displays a list of accounts in a specific category according to your parameters.
     *
     * @summary Instagram
     * @throws FetchError<401, types.CategoryInstagramResponse401> Unauthorized
     */
    categoryInstagram(metadata?: types.CategoryInstagramMetadataParam): Promise<FetchResponse<200, types.CategoryInstagramResponse200>>;
    /**
     * Displays a list of accounts in a specific category according to your parameters.
     *
     * @summary BattleNet
     * @throws FetchError<401, types.CategoryBattleNetResponse401> Unauthorized
     */
    categoryBattleNet(metadata?: types.CategoryBattleNetMetadataParam): Promise<FetchResponse<200, types.CategoryBattleNetResponse200>>;
    /**
     * Displays a list of accounts in a specific category according to your parameters.
     *
     * @summary ChatGPT
     * @throws FetchError<401, types.CategoryChatGptResponse401> Unauthorized
     */
    categoryChatGPT(metadata?: types.CategoryChatGptMetadataParam): Promise<FetchResponse<200, types.CategoryChatGptResponse200>>;
    /**
     * Displays a list of accounts in a specific category according to your parameters.
     *
     * @summary VPN
     * @throws FetchError<401, types.CategoryVpnResponse401> Unauthorized
     */
    categoryVpn(metadata?: types.CategoryVpnMetadataParam): Promise<FetchResponse<200, types.CategoryVpnResponse200>>;
    /**
     * Displays a list of accounts in a specific category according to your parameters.
     *
     * @summary Cinema
     * @throws FetchError<401, types.CategoryCinemaResponse401> Unauthorized
     */
    categoryCinema(metadata?: types.CategoryCinemaMetadataParam): Promise<FetchResponse<200, types.CategoryCinemaResponse200>>;
    /**
     * Displays a list of accounts in a specific category according to your parameters.
     *
     * @summary Roblox
     * @throws FetchError<401, types.CategoryRobloxResponse401> Unauthorized
     */
    categoryRoblox(metadata?: types.CategoryRobloxMetadataParam): Promise<FetchResponse<200, types.CategoryRobloxResponse200>>;
    /**
     * Displays a list of accounts in a specific category according to your parameters.
     *
     * @summary Spotify
     * @throws FetchError<401, types.CategorySpotifyResponse401> Unauthorized
     */
    categorySpotify(metadata?: types.CategorySpotifyMetadataParam): Promise<FetchResponse<200, types.CategorySpotifyResponse200>>;
    /**
     * Displays a list of accounts in a specific category according to your parameters.
     *
     * @summary Warface
     * @throws FetchError<401, types.CategoryWarfaceResponse401> Unauthorized
     */
    categoryWarface(metadata?: types.CategoryWarfaceMetadataParam): Promise<FetchResponse<200, types.CategoryWarfaceResponse200>>;
    /**
     * Displays a list of accounts in a specific category according to your parameters.
     *
     * @summary Minecraft
     * @throws FetchError<401, types.CategoryMinecraftResponse401> Unauthorized
     */
    categoryMinecraft(metadata?: types.CategoryMinecraftMetadataParam): Promise<FetchResponse<200, types.CategoryMinecraftResponse200>>;
    /**
     * Display category list.
     *
     * @summary Get Categories
     * @throws FetchError<401, types.CategoryListResponse401> Unauthorized
     */
    categoryList(metadata?: types.CategoryListMetadataParam): Promise<FetchResponse<200, types.CategoryListResponse200>>;
    /**
     * Displays search parameters for a category.
     *
     * @summary Get Category Search Params
     * @throws FetchError<401, types.CategoryParamsResponse401> Unauthorized
     */
    categoryParams(metadata: types.CategoryParamsMetadataParam): Promise<FetchResponse<200, types.CategoryParamsResponse200>>;
    /**
     * Displays a list of games in the category.
     *
     * @summary Get Category Games
     * @throws FetchError<401, types.CategoryGamesResponse401> Unauthorized
     */
    categoryGames(metadata: types.CategoryGamesMetadataParam): Promise<FetchResponse<200, types.CategoryGamesResponse200>>;
    /**
     * Displays a list of owned accounts.
     *
     * @summary Get All Owned Accounts
     * @throws FetchError<401, types.ListOwnedResponse401> Unauthorized
     */
    listOwned(metadata?: types.ListOwnedMetadataParam): Promise<FetchResponse<200, types.ListOwnedResponse200>>;
    /**
     * Displays a list of purchased accounts.
     *
     * @summary Get All Purchased Accounts
     * @throws FetchError<401, types.ListOrdersResponse401> Unauthorized
     * @throws FetchError<403, types.ListOrdersResponse403> Error Response.
     */
    listOrders(metadata?: types.ListOrdersMetadataParam): Promise<FetchResponse<200, types.ListOrdersResponse200>>;
    /**
     * Displays a list of favourites accounts.
     *
     * @summary Get All Favourites Accounts
     * @throws FetchError<401, types.ListFavoritesResponse401> Unauthorized
     */
    listFavorites(metadata?: types.ListFavoritesMetadataParam): Promise<FetchResponse<200, types.ListFavoritesResponse200>>;
    /**
     * Displays a list of viewed accounts.
     *
     * @summary Get All Viewed Accounts
     * @throws FetchError<401, types.ListViewedResponse401> Unauthorized
     */
    listViewed(metadata?: types.ListViewedMetadataParam): Promise<FetchResponse<200, types.ListViewedResponse200>>;
    /**
     * Displays account information.
     *
     * @summary Get Account
     * @throws FetchError<401, types.ManagingGetResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingGetResponse403> Error Response.
     * @throws FetchError<404, types.ManagingGetResponse404> Error Response.
     */
    managingGet(metadata: types.ManagingGetMetadataParam): Promise<FetchResponse<200, types.ManagingGetResponse200>>;
    /**
     * Deletes your account from public search. Deletion type is soft. You can restore account
     * after deletion if you want.
     *
     * @summary Delete Account
     * @throws FetchError<401, types.MangingDeleteResponse401> Unauthorized
     * @throws FetchError<403, types.MangingDeleteResponse403> Error Response.
     * @throws FetchError<404, types.MangingDeleteResponse404> Error Response.
     */
    mangingDelete(metadata: types.MangingDeleteMetadataParam): Promise<FetchResponse<200, types.MangingDeleteResponse200>>;
    /**
     * Create a Arbitrage.
     *
     * @summary Create Arbitrage
     * @throws FetchError<401, types.ManagingArbitrageResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingArbitrageResponse403> Error Response.
     * @throws FetchError<404, types.ManagingArbitrageResponse404> Error Response.
     */
    managingArbitrage(body: types.ManagingArbitrageBodyParam, metadata: types.ManagingArbitrageMetadataParam): Promise<FetchResponse<200, types.ManagingArbitrageResponse200>>;
    /**
     * Bulk get up to 250 accounts.
     * You can get only your accounts or those you have purchased.
     *
     * @summary Bulk Get Accounts
     * @throws FetchError<401, types.ManagingBulkGetResponse401> Unauthorized
     */
    managingBulkGet(body: types.ManagingBulkGetBodyParam): Promise<FetchResponse<200, types.ManagingBulkGetResponse200>>;
    /**
     * Gets Account steam inventory value.
     *
     * @summary Get Account Steam Inventory Value
     * @throws FetchError<401, types.ManagingSteamInventoryValueResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingSteamInventoryValueResponse403> Error Response.
     */
    managingSteamInventoryValue(metadata: types.ManagingSteamInventoryValueMetadataParam): Promise<FetchResponse<200, types.ManagingSteamInventoryValueResponse200>>;
    /**
     * Gets steam inventory value.
     * > 📘 This method is rate limited. You can send 20 requests per minute (3s delay between
     * requests)
     *
     * @summary Get Steam Inventory Value
     * @throws FetchError<401, types.ManagingSteamValueResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingSteamValueResponse403> Error Response.
     */
    managingSteamValue(metadata: types.ManagingSteamValueMetadataParam): Promise<FetchResponse<200, types.ManagingSteamValueResponse200>>;
    /**
     * Returns Steam account profile/games preview.
     *
     * @summary Get Steam HTML
     * @throws FetchError<401, types.ManagingSteamPreviewResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingSteamPreviewResponse403> Error Response.
     * @throws FetchError<404, types.ManagingSteamPreviewResponse404> Error Response.
     */
    managingSteamPreview(metadata: types.ManagingSteamPreviewMetadataParam): Promise<FetchResponse<200, types.ManagingSteamPreviewResponse200>>;
    /**
     * Edits any details of account.
     *
     * @summary Edit Account
     * @throws FetchError<401, types.ManagingEditResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingEditResponse403> Error Response.
     * @throws FetchError<404, types.ManagingEditResponse404> Error Response.
     */
    managingEdit(metadata: types.ManagingEditMetadataParam): Promise<FetchResponse<200, types.ManagingEditResponse200>>;
    /**
     * Edits a note for the account.
     *
     * @summary Edit Note
     * @throws FetchError<401, types.ManagingNoteResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingNoteResponse403> Error Response.
     * @throws FetchError<404, types.ManagingNoteResponse404> Error Response.
     */
    managingNote(body: types.ManagingNoteBodyParam, metadata: types.ManagingNoteMetadataParam): Promise<FetchResponse<200, types.ManagingNoteResponse200>>;
    managingNote(metadata: types.ManagingNoteMetadataParam): Promise<FetchResponse<200, types.ManagingNoteResponse200>>;
    /**
     * Update inventory value.
     *
     * @summary Update Inventory Value
     * @throws FetchError<401, types.ManagingSteamUpdateValueResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingSteamUpdateValueResponse403> Error Response.
     * @throws FetchError<404, types.ManagingSteamUpdateValueResponse404> Error Response.
     */
    managingSteamUpdateValue(metadata: types.ManagingSteamUpdateValueMetadataParam): Promise<FetchResponse<200, types.ManagingSteamUpdateValueResponse200>>;
    /**
     * Bumps account in the search.
     *
     * @summary Bump Account
     * @throws FetchError<401, types.ManagingBumpResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingBumpResponse403> Error Response.
     * @throws FetchError<404, types.ManagingBumpResponse404> Error Response.
     */
    managingBump(metadata: types.ManagingBumpMetadataParam): Promise<FetchResponse<200, types.ManagingBumpResponse200>>;
    /**
     * Opens account.
     *
     * @summary Open Account
     * @throws FetchError<401, types.ManagingOpenResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingOpenResponse403> Error Response.
     * @throws FetchError<404, types.ManagingOpenResponse404> Error Response.
     */
    managingOpen(metadata: types.ManagingOpenMetadataParam): Promise<FetchResponse<200, types.ManagingOpenResponse200>>;
    /**
     * Closes account.
     *
     * @summary Close Account
     * @throws FetchError<401, types.ManagingCloseResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingCloseResponse403> Error Response.
     * @throws FetchError<404, types.ManagingCloseResponse404> Error Response.
     */
    managingClose(metadata: types.ManagingCloseMetadataParam): Promise<FetchResponse<200, types.ManagingCloseResponse200>>;
    /**
     * Get account image.
     *
     * @summary Get Account Image
     * @throws FetchError<401, types.ManagingImageResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingImageResponse403> Error Response.
     * @throws FetchError<404, types.ManagingImageResponse404> Error Response.
     */
    managingImage(metadata: types.ManagingImageMetadataParam): Promise<FetchResponse<200, types.ManagingImageResponse200>>;
    /**
     * Check and buy account.
     *
     * @summary Fast Buy Account
     * @throws FetchError<401, types.PurchasingFastBuyResponse401> Unauthorized
     * @throws FetchError<403, types.PurchasingFastBuyResponse403> Error Response.
     * @throws FetchError<404, types.PurchasingFastBuyResponse404> Error Response.
     */
    purchasingFastBuy(metadata: types.PurchasingFastBuyMetadataParam): Promise<FetchResponse<200, types.PurchasingFastBuyResponse200>>;
    /**
     * Checking account for validity.
     *
     * @summary Check Account
     * @throws FetchError<401, types.PurchasingCheckResponse401> Unauthorized
     * @throws FetchError<403, types.PurchasingCheckResponse403> Error Response.
     * @throws FetchError<404, types.PurchasingCheckResponse404> Error Response.
     */
    purchasingCheck(metadata: types.PurchasingCheckMetadataParam): Promise<FetchResponse<200, types.PurchasingCheckResponse200>>;
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
    purchasingConfirm(metadata: types.PurchasingConfirmMetadataParam): Promise<FetchResponse<200, types.PurchasingConfirmResponse200>>;
    /**
     * Adds and check account on validity. If account is valid, account will be published on
     * the market.
     *
     * **If you receive a "captcha" error, that you should send same request again.**
     *
     * @summary Fast Account Upload
     * @throws FetchError<401, types.PublishingFastSellResponse401> Unauthorized
     * @throws FetchError<403, types.PublishingFastSellResponse403> Error Response.
     */
    publishingFastSell(body: types.PublishingFastSellBodyParam, metadata: types.PublishingFastSellMetadataParam): Promise<FetchResponse<200, types.PublishingFastSellResponse200>>;
    publishingFastSell(metadata: types.PublishingFastSellMetadataParam): Promise<FetchResponse<200, types.PublishingFastSellResponse200>>;
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
    publishingAdd(metadata: types.PublishingAddMetadataParam): Promise<FetchResponse<200, types.PublishingAddResponse200>>;
    /**
     * Check and put up to sale not published account OR update account information existing
     * account.
     *
     * **If you receive a "captcha" error, that you should send same request again.**
     *
     * @summary Check Account Details
     * @throws FetchError<401, types.PublishingCheckResponse401> Unauthorized
     * @throws FetchError<403, types.PublishingCheckResponse403> Error Response.
     * @throws FetchError<404, types.PublishingCheckResponse404> Error Response.
     */
    publishingCheck(body: types.PublishingCheckBodyParam, metadata: types.PublishingCheckMetadataParam): Promise<FetchResponse<200, types.PublishingCheckResponse200>>;
    publishingCheck(metadata: types.PublishingCheckMetadataParam): Promise<FetchResponse<200, types.PublishingCheckResponse200>>;
    /**
     * Get info about not published item. For categories, which required temporary email, you
     * will get temporary email in response.
     *
     * @summary Get Temporary Mail
     * @throws FetchError<401, types.PublishingMailResponse401> Unauthorized
     * @throws FetchError<403, types.PublishingMailResponse403> Error Response.
     * @throws FetchError<404, types.PublishingMailResponse404> Error Response.
     */
    publishingMail(metadata: types.PublishingMailMetadataParam): Promise<FetchResponse<200, types.PublishingMailResponse200>>;
    /**
     * Gets confirmation code or link.
     *
     * @summary Get Email Confirmation Code
     * @throws FetchError<401, types.ManagingEmailCodeResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingEmailCodeResponse403> Error Response.
     * @throws FetchError<404, types.ManagingEmailCodeResponse404> Error Response.
     */
    managingEmailCode(metadata?: types.ManagingEmailCodeMetadataParam): Promise<FetchResponse<200, types.ManagingEmailCodeResponse200>>;
    /**
     * Returns steam mafile.
     * > ❗️ This action is cancelling active account guarantee
     *
     * @summary Get Mafile
     * @throws FetchError<401, types.ManagingSteamMafileResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingSteamMafileResponse403> Error Response.
     * @throws FetchError<404, types.ManagingSteamMafileResponse404> Error Response.
     */
    managingSteamMafile(metadata: types.ManagingSteamMafileMetadataParam): Promise<FetchResponse<200, types.ManagingSteamMafileResponse200>>;
    /**
     * Remove steam mafile.
     * > ❗️ This will unlink the authenticator from the account and remove mafile from the item
     *
     * @summary Remove Mafile
     * @throws FetchError<401, types.ManagingSteamRemoveMafileResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingSteamRemoveMafileResponse403> Error Response.
     * @throws FetchError<404, types.ManagingSteamRemoveMafileResponse404> Error Response.
     */
    managingSteamRemoveMafile(metadata: types.ManagingSteamRemoveMafileMetadataParam): Promise<FetchResponse<200, types.ManagingSteamRemoveMafileResponse200>>;
    /**
     * Gets confirmation code from MaFile (Only for Steam accounts).
     *
     * @summary Get Mafile Confirmation Code
     * @throws FetchError<401, types.ManagingSteamMafileCodeResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingSteamMafileCodeResponse403> Error Response.
     * @throws FetchError<404, types.ManagingSteamMafileCodeResponse404> Error Response.
     */
    managingSteamMafileCode(metadata: types.ManagingSteamMafileCodeMetadataParam): Promise<FetchResponse<200, types.ManagingSteamMafileCodeResponse200>>;
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
    managingSteamSDA(metadata: types.ManagingSteamSdaMetadataParam): Promise<FetchResponse<200, types.ManagingSteamSdaResponse200>>;
    /**
     * Gets confirmation code from Telegram.
     *
     * @summary Get Telegram Confirmation Code
     * @throws FetchError<401, types.ManagingTelegramCodeResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingTelegramCodeResponse403> Error Response.
     * @throws FetchError<404, types.ManagingTelegramCodeResponse404> Error Response.
     */
    managingTelegramCode(metadata: types.ManagingTelegramCodeMetadataParam): Promise<FetchResponse<200, types.ManagingTelegramCodeResponse200>>;
    /**
     * Resets Telegram authorizations.
     *
     * @summary Telegram Reset Auth
     * @throws FetchError<401, types.ManagingTelegramResetAuthResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingTelegramResetAuthResponse403> Error Response.
     * @throws FetchError<404, types.ManagingTelegramResetAuthResponse404> Error Response.
     */
    managingTelegramResetAuth(metadata: types.ManagingTelegramResetAuthMetadataParam): Promise<FetchResponse<200, types.ManagingTelegramResetAuthResponse200>>;
    /**
     * Cancel guarantee of account. It can be useful for account reselling.
     *
     * @summary Cancel Guarantee
     * @throws FetchError<401, types.ManagingRefuseGuaranteeResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingRefuseGuaranteeResponse403> Error Response.
     * @throws FetchError<404, types.ManagingRefuseGuaranteeResponse404> Error Response.
     */
    managingRefuseGuarantee(metadata: types.ManagingRefuseGuaranteeMetadataParam): Promise<FetchResponse<200, types.ManagingRefuseGuaranteeResponse200>>;
    /**
     * Checks the guarantee and cancels it if there are reasons to cancel it.
     *
     * @summary Check Guarantee
     * @throws FetchError<401, types.ManagingCheckGuaranteeResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingCheckGuaranteeResponse403> Error Response.
     * @throws FetchError<404, types.ManagingCheckGuaranteeResponse404> Error Response.
     */
    managingCheckGuarantee(metadata: types.ManagingCheckGuaranteeMetadataParam): Promise<FetchResponse<200, types.ManagingCheckGuaranteeResponse200>>;
    /**
     * Changes password of account.
     *
     * @summary Change Password
     * @throws FetchError<401, types.ManagingChangePasswordResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingChangePasswordResponse403> Error Response.
     * @throws FetchError<404, types.ManagingChangePasswordResponse404> Error Response.
     */
    managingChangePassword(metadata: types.ManagingChangePasswordMetadataParam): Promise<FetchResponse<200, types.ManagingChangePasswordResponse200>>;
    /**
     * Gets password from temp email of account. After calling of this method, the warranty
     * will be cancelled and you cannot automatically resell account.
     *
     * @summary Get Temp Email Password
     * @throws FetchError<401, types.ManagingTempEmailPasswordResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingTempEmailPasswordResponse403> Error Response.
     * @throws FetchError<404, types.ManagingTempEmailPasswordResponse404> Error Response.
     */
    managingTempEmailPassword(metadata: types.ManagingTempEmailPasswordMetadataParam): Promise<FetchResponse<200, types.ManagingTempEmailPasswordResponse200>>;
    /**
     * Adds tag for the account.
     *
     * @summary Tag Account
     * @throws FetchError<401, types.ManagingTagResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingTagResponse403> Error Response.
     * @throws FetchError<404, types.ManagingTagResponse404> Error Response.
     */
    managingTag(metadata: types.ManagingTagMetadataParam): Promise<FetchResponse<200, types.ManagingTagResponse200>>;
    /**
     * Deletes tag from the account.
     *
     * @summary Untag Account
     * @throws FetchError<401, types.ManagingUntagResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingUntagResponse403> Error Response.
     * @throws FetchError<404, types.ManagingUntagResponse404> Error Response.
     */
    managingUntag(metadata: types.ManagingUntagMetadataParam): Promise<FetchResponse<200, types.ManagingUntagResponse200>>;
    /**
     * Adds account to favorites.
     *
     * @summary Favorite
     * @throws FetchError<401, types.ManagingFavoriteResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingFavoriteResponse403> Error Response.
     * @throws FetchError<404, types.ManagingFavoriteResponse404> Error Response.
     */
    managingFavorite(metadata: types.ManagingFavoriteMetadataParam): Promise<FetchResponse<200, types.ManagingFavoriteResponse200>>;
    /**
     * Delete account from favorites.
     *
     * @summary Unfavorite
     * @throws FetchError<401, types.ManagingUnfavoriteResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingUnfavoriteResponse403> Error Response.
     * @throws FetchError<404, types.ManagingUnfavoriteResponse404> Error Response.
     */
    managingUnfavorite(metadata: types.ManagingUnfavoriteMetadataParam): Promise<FetchResponse<200, types.ManagingUnfavoriteResponse200>>;
    /**
     * Stick account in the top of search.
     *
     * @summary Stick Account
     * @throws FetchError<401, types.ManagingStickResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingStickResponse403> Error Response.
     * @throws FetchError<404, types.ManagingStickResponse404> Error Response.
     */
    managingStick(metadata: types.ManagingStickMetadataParam): Promise<FetchResponse<200, types.ManagingStickResponse200>>;
    /**
     * Unstick account from the top of search.
     *
     * @summary Unstick Account
     * @throws FetchError<401, types.ManagingUnstickResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingUnstickResponse403> Error Response.
     * @throws FetchError<404, types.ManagingUnstickResponse404> Error Response.
     */
    managingUnstick(metadata: types.ManagingUnstickMetadataParam): Promise<FetchResponse<200, types.ManagingUnstickResponse200>>;
    /**
     * Transfer account to another user.
     *
     * @summary Change Account Owner
     * @throws FetchError<401, types.ManagingTransferResponse401> Unauthorized
     * @throws FetchError<403, types.ManagingTransferResponse403> Error Response.
     * @throws FetchError<404, types.ManagingTransferResponse404> Error Response.
     */
    managingTransfer(metadata: types.ManagingTransferMetadataParam): Promise<FetchResponse<200, types.ManagingTransferResponse200>>;
    /**
     * Displays info about your profile.
     *
     * @summary Get Profile
     * @throws FetchError<401, types.ProfileGetResponse401> Unauthorized
     */
    profileGet(): Promise<FetchResponse<200, types.ProfileGetResponse200>>;
    /**
     * Change settings about your profile on the market.
     *
     * @summary Edit Market Settings
     * @throws FetchError<401, types.ProfileEditResponse401> Unauthorized
     */
    profileEdit(metadata?: types.ProfileEditMetadataParam): Promise<FetchResponse<200, types.ProfileEditResponse200>>;
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
    paymentsInvoiceGet(metadata?: types.PaymentsInvoiceGetMetadataParam): Promise<FetchResponse<200, types.PaymentsInvoiceGetResponse200>>;
    /**
     * Create invoice.
     *
     * Required scopes:
     * + **invoice**
     *
     * @summary Create invoice
     * @throws FetchError<401, types.PaymentsInvoiceCreateResponse401> Unauthorized
     */
    paymentsInvoiceCreate(metadata: types.PaymentsInvoiceCreateMetadataParam): Promise<FetchResponse<200, types.PaymentsInvoiceCreateResponse200>>;
    /**
     * Get invoice list.
     *
     * Required scopes:
     * + **invoice**
     *
     * @summary Get invoice list
     * @throws FetchError<401, types.PaymentsInvoiceListResponse401> Unauthorized
     */
    paymentsInvoiceList(metadata?: types.PaymentsInvoiceListMetadataParam): Promise<FetchResponse<200, types.PaymentsInvoiceListResponse200>>;
    /**
     * Get currency list.
     *
     * @summary Get Currency
     * @throws FetchError<401, types.PaymentsCurrencyResponse401> Unauthorized
     */
    paymentsCurrency(): Promise<FetchResponse<200, types.PaymentsCurrencyResponse200>>;
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
    paymentsTransfer(metadata: types.PaymentsTransferMetadataParam): Promise<FetchResponse<200, types.PaymentsTransferResponse200>>;
    /**
     * Get transfer limits and get fee amount for transfer.
     *
     * @summary Check Transfer Fee
     * @throws FetchError<401, types.PaymentsFeeResponse401> Unauthorized
     */
    paymentsFee(metadata?: types.PaymentsFeeMetadataParam): Promise<FetchResponse<200, types.PaymentsFeeResponse200>>;
    /**
     * Cancels a transfer with a hold that was sent to your account.
     *
     * @summary Cancel Transfer
     * @throws FetchError<401, types.PaymentsCancelResponse401> Unauthorized
     * @throws FetchError<403, types.PaymentsCancelResponse403> Error Response.
     * @throws FetchError<404, types.PaymentsCancelResponse404> Error Response.
     */
    paymentsCancel(metadata: types.PaymentsCancelMetadataParam): Promise<FetchResponse<200, types.PaymentsCancelResponse200>>;
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
    paymentsHistory(metadata?: types.PaymentsHistoryMetadataParam): Promise<FetchResponse<200, types.PaymentsHistoryResponse200>>;
    /**
     * Gets your proxy list.
     *
     * @summary Get Proxy
     * @throws FetchError<401, types.ProxyGetResponse401> Unauthorized
     */
    proxyGet(): Promise<FetchResponse<200, types.ProxyGetResponse200>>;
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
    proxyAdd(metadata?: types.ProxyAddMetadataParam): Promise<FetchResponse<200, types.ProxyAddResponse200>>;
    /**
     * Delete single or all proxies.
     *
     * @summary Delete Proxy
     * @throws FetchError<401, types.ProxyDeleteResponse401> Unauthorized
     * @throws FetchError<403, types.ProxyDeleteResponse403> Error Response.
     * @throws FetchError<404, types.ProxyDeleteResponse404> Proxy Not Found.
     */
    proxyDelete(metadata?: types.ProxyDeleteMetadataParam): Promise<FetchResponse<200, types.ProxyDeleteResponse200>>;
    /**
     * Execute multiple API requests at once (Separated by comma). Maximum batch jobs is 10.
     *
     * @summary Batch
     * @throws FetchError<400, types.BatchResponse400> Error Response.
     * @throws FetchError<401, types.BatchResponse401> Unauthorized
     */
    batch(body: types.BatchBodyParam): Promise<FetchResponse<200, types.BatchResponse200>>;
}
declare const createSDK: SDK;
export default createSDK;
