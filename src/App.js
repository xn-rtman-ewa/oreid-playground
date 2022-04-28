// @ts-check
/* eslint-disable no-unused-vars */
import React, { Dispatch, SetStateAction, useState, useMemo, useEffect } from "react";
import "./styles.css";
import OreId from "oreid-js/dist/core/oreId";
import {
  AuthProvider,
  LoginProvider,
  OreIdOptions,
  TransactionData,
  UserSourceData,
  WebWidgetAction,
} from "oreid-js/dist/models";
import { createOreIdWebWidget, OreIdWebWidget, OnError } from "oreid-webwidget";
import OreIdLoginButton from "oreid-login-button";
import { makeStyles } from "@material-ui/core/styles";
import { ButtonGroup, Snackbar } from "@material-ui/core";
import { Alert, Color } from "@material-ui/lab";
import algoSignerProvider from "eos-transit-algosigner-provider";
import keycatProvider from "eos-transit-keycat-provider";
import ledgerProvider from "eos-transit-ledger-provider";
import lynxProvider from "eos-transit-lynx-provider";
import meetoneProvider from "eos-transit-meetone-provider";
import portisProvider from "eos-transit-portis-provider";
import scatterProvider from "eos-transit-scatter-provider";
import simpleosProvider from "eos-transit-simpleos-provider";
import tokenpocketProvider from "eos-transit-tokenpocket-provider";
import web3Provider from "eos-transit-web3-provider";
import UserOreId from "./UserOreId";

/** @type {Object.<string, Color>} */
const Severity = {
  Info: "info",
  Warning: "warning",
  Success: "success",
  Error: "error",
};

/**
 * @typedef {{
 *   warning?: string,
 *   error?: string,
 *   success?: string,
 *   info?: string,
 * }} Logs
 */

const oreIdCallbackUrl = `${window.location.origin}/oreidcallback`;

const oreIdUrl = {
  app: "https://staging.oreid.io",
  auth: "https://staging.service.oreid.io",
};

/** @type OreIdOptions  */
const myOreIdOptions = {
  oreIdUrl: oreIdUrl.auth,
  appId: "demo_0097ed83e0a54e679ca46d082ee0e33a",
  authCallbackUrl: oreIdCallbackUrl,
  signCallbackUrl: oreIdCallbackUrl,
  eosTransitWalletProviders: [
    // @ts-ignore
    algoSignerProvider(),
    keycatProvider(),
    ledgerProvider(),
    lynxProvider(),
    meetoneProvider(),
    portisProvider(),
    scatterProvider(),
    simpleosProvider(),
    tokenpocketProvider(),
    // @ts-ignore
    web3Provider(),
  ],
};

const useStyles = makeStyles((theme) => ({
  container: {
    backgroundColor: "#282c34",
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  buttons: {
    display: "grid",
    gridTemplateColumns: "225px 225px 225px",
    gridTemplateRows: "50px 50px 50px 50px",
    gridGap: theme.spacing(2),
    "& button:hover": {
      cursor: "pointer",
    },
  },
}));

export default function App() {
  /** @type {[OreIdWebWidget, Dispatch<SetStateAction<OreIdWebWidget>>]} */
  const [oreIdWebwidget, setOreIdWebwidget] = useState(null);
  /** @type {[UserSourceData, Dispatch<SetStateAction<UserSourceData>>]} */
  const [userInfo, setUserInfo] = useState(null);
  /** @type {[Logs, Dispatch<SetStateAction<Logs>>]} */
  const [logs, setLogs] = useState({});
  const [openSnackbar, setOpenSnackbar] = useState(false);
  /** @type {[boolean, Dispatch<SetStateAction<boolean>>]} */
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  /** @type {[WebWidgetAction, Dispatch<SetStateAction<WebWidgetAction>>]} */
  const [widgetAction, setWidgetAction] = useState(null);
  /** @type {[AuthProvider, Dispatch<SetStateAction<AuthProvider>>]} */
  const [loggedProvider, setLoggedProvider] = useState(null);
  /** @type {[Color, Dispatch<SetStateAction<Color>>]} */
  const [severity, setSeverity] = useState(null);

  const styles = useStyles();

  // Intialize oreId
  // IMPORTANT - For a production app, you must protect your api key. A create-react-app app will leak the key since it all runs in the browser.
  // To protect the key, you need to set-up a proxy server. See https://github.com/TeamAikon/ore-id-docs/tree/master/examples/react/advanced/react-server
  const oreId = useMemo(() => {
    const oreId = new OreId(myOreIdOptions);
    // inject oreId object into window for user accessibility
    // @ts-ignore
    window.oreId = oreId;
    return oreId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Call oreId.login() - this returns a redirect url which will launch the login flow (for the specified provider)
   When complete, the browser will be redirected to the authCallbackUrl (specified in oredId options) */
  const handleLogin = async (provider) => {
    oreIdWebwidget.onAuth({
      params: { provider },
      onSuccess: (userInfo) => {
        window.alert('sc')
        handleUserInfo(userInfo)
        setLogs({ [Severity.Success]: "Logged In Successfully!" })
      },
      onError: error => {
        setLogs({ [Severity.Error]: error.errors })
      },
    });
  };

  const handleUserInfo = (userInfo) => {
    if (userInfo?.accountName) {
      userInfo.permissions = oreId.auth.user._userSourceData.permissions
      setUserInfo(Object.freeze(userInfo));
      setIsLoggedIn(true);
      // Save the provider to send in test flows
      setLoggedProvider(oreId.accessTokenHelper?.decodedAccessToken["https://oreid.aikon.com/provider"]);
      return;
    }
    setIsLoggedIn(false);
    setUserInfo(null);
    setLoggedProvider(null);
  };

  /** Remove user info from local storage */
  const handleLogout = () => {
    oreIdWebwidget.onLogout({
      onSuccess: () => {
        oreId.logout();
        handleUserInfo(null);
        setLogs({ [Severity.Success]: "Logged Out Successfully!" });
      },
      onError: () => setLogs({ [Severity.Error]: "An error occured while trying to logout!" })
    })
  };

  /** Load the user from local storage - user info is automatically saved to local storage by oreId.getUserInfoFromApi() */
  const loadUserFromLocalStorage = async () => {
    if (!oreId.accessToken) return;
    await oreId.auth.user.getData()
    const userInfo = oreId.auth.user.data;
    handleUserInfo(userInfo);
  };

  /** Retrieve user info from ORE ID service - user info is automatically saved to local storage */
  const loadUserFromApi = async () => {
    await oreId.auth.user.getData();
    handleUserInfo(oreId.auth.user.data);
  };

  const handleOreIdCallback = () => {
    const urlPath = `${window.location.origin}${window.location.pathname}`;
    if (urlPath === myOreIdOptions.authCallbackUrl) {
      const { errors } = oreId.auth.handleAuthCallback(window.location.href);
      if (!errors) {
        window.location.replace("/");
      } else {
        setLogs({ [Severity.Error]: errors.join(" ") });
      }
    }
  };

  const handleSignString = async ({ chainNetwork, walletType, onSuccess }) => {
    try {
      const { signedString } = await oreId.signStringWithWallet({
        account: userInfo?.accountName,
        walletType,
        chainNetwork,
        string: "Verify your Account",
        message: "",
      });
      console.log({ signedString });
      setTimeout(() => {
        loadUserFromApi();
      }, 2000);
      if (signedString) {
        setLogs({ [Severity.Success]: "Account Added Successfully!" });
        onSuccess();
      }
    } catch (error) {
      console.error(error);
      setLogs({ [Severity.Error]: error.message });
    }
  };

  // compose params for action
  const composeWidgetOptionsForAction = async (action, args) => {
    switch (action) {
      case WebWidgetAction.Sign:
        if (!args?.chainAccountPermission || !args.transaction) {
          setLogs({
            [Severity.Error]: "Please select a Permission and Transaction to Sign",
          });
          return;
        }
        const { chainAccount, chainNetwork, privateKeyStoredExterally } = args.chainAccountPermission;
        /** @type TransactionData */
        const transactionData = {
          chainAccount,
          chainNetwork,
          transaction: args?.transaction,
          signOptions: {
            allowChainAccountSelection: privateKeyStoredExterally,
            broadcast: true, // if broadcast=true, ore id will broadcast the transaction to the chain network for you
            returnSignedTransaction: false,
            preventAutosign: true, // prevent auto sign even if transaction is auto signable
          },
        };
        const transaction = await oreId.createTransaction(transactionData)
        setWidgetAction(WebWidgetAction.Sign)
        oreIdWebwidget.onSign({
          transaction,
          onSuccess: handleWidgetSuccess,
          onError: handleWidgetError,
        })
        break
      case WebWidgetAction.NewChainAccount:
        // compose params to create an additional blockchain account
        // IMPORTANT: newAccount is for creating an ADDITIONAL blockchain account for an existing ORE ID wallet - you normally would not need to do this
        setWidgetAction(WebWidgetAction.NewChainAccount)
        oreIdWebwidget.onNewChainAccount({
          params: { chainNetwork: args?.chainNetwork },
          onSuccess: handleWidgetSuccess,
          onError: handleWidgetError,
        })
        break
      case WebWidgetAction.RecoverAccount:
        setWidgetAction(WebWidgetAction.RecoverAccount)
        oreIdWebwidget.onRecoverAccount({
          params: {}, 
          onSuccess: handleWidgetSuccess,
          onError: handleWidgetError,
        })
        break
      default:
        return null;
    }
  };

  /** Set widget properties for selected action */
  const handleAction = async (action, args) => {
    composeWidgetOptionsForAction(action, args);
  };

  /** Handle the authCallback coming back from ORE ID with an "account" parameter indicating that a user has logged in */
  useEffect(() => {
    createOreIdWebWidget(oreId, window).then(oreIdWebwidget => {
      setOreIdWebwidget(oreIdWebwidget)
    })
    // handles the auth callback url
    loadUserFromLocalStorage().then(() => {
      handleOreIdCallback();
      // oreId.auth.user.getData().then(data => console.log({data}));
      // Uncaught (in promise) TypeError: Cannot assign to read only property '_accountName' of object '#<User>'
      !oreId.accessToken && setIsLoggedIn(false);
    });
    try {
      // eslint-disable-next-line no-unused-expressions
      window.parent.document;
    } catch (error) {
      setLogs({
        [Severity.Warning]: (
          <>
            Open sandbox browser in{" "}
            <a target="_blank" href={window.location.href} rel="noreferrer">
              New Window
            </a>{" "}
            to avoid callback errors
          </>
        ),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (logs.info) setSeverity(Severity.Info);
    else if (logs.warning) setSeverity(Severity.Warning);
    if (logs.success) setSeverity(Severity.Success);
    else if (logs.error) setSeverity(Severity.Error);
    if (logs?.info || logs?.error || logs?.warning || logs?.success) setOpenSnackbar(true);
  }, [logs]);

  const handleWidgetSuccess = (result) => {
    console.log(JSON.stringify(result, null, 2));
    switch (widgetAction) {
      case WebWidgetAction.Sign:
        setLogs({ [Severity.Success]: "Signed Transaction Successfully!" });
        break;
      case WebWidgetAction.NewChainAccount:
        setLogs({
          [Severity.Success]: `New Chain Account ${result?.data["chain_account"] || ""} Created Successfully!`,
        });
        break;
      case WebWidgetAction.RecoverAccount:
        setLogs({ [Severity.Success]: "Recovered Password Successfully!" });
        break;
      default:
        break;
    }
    setWidgetAction(null);
  };

  /** @type OnError */
  const handleWidgetError = (result) => {
    result?.data && console.error(result.data);
    setLogs({ [Severity.Error]: result?.errors || "An error occured" });
    setWidgetAction(null);
  };

  return (
    <div className={styles.container}>
      {isLoggedIn !== null && (
        <>
          {isLoggedIn ? (
            <UserOreId
              appId={myOreIdOptions.appId}
              oreIdAppUrl={oreIdUrl.app}
              userInfo={userInfo}
              onAction={handleAction}
              onConnectWallet={handleSignString}
              onLogout={handleLogout}
              onRefresh={() => loadUserFromApi()}
            />
          ) : (
            <ButtonGroup className={styles.buttons}>
              {/* Supported Login Options */}
              {Object.keys(LoginProvider)
                .filter((loginProvider) => LoginProvider[loginProvider] !== LoginProvider.Custodial)
                .map((loginProvider) => (
                  <OreIdLoginButton key={loginProvider} provider={LoginProvider[loginProvider]} onClick={(e, provider) => handleLogin(provider)} />
                ))}
            </ButtonGroup>
          )}
        </>
      )}
      <Snackbar
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert severity={severity}>{logs[severity]}</Alert>
      </Snackbar>
    </div>
  );
}
