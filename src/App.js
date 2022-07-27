// @ts-check
/* eslint-disable no-unused-vars */
import React, { Dispatch, SetStateAction, useCallback, useState, useMemo, useEffect } from "react";
import "./styles.css";
import {
  OreId,
  AuthProvider,
  LoginProvider,
  TransactionData,
  WebWidgetAction,
 } from "oreid-js";
import { WebPopup } from 'oreid-webpopup'
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

// optional
const oreIdUrl = {
  app: "https://staging.oreid.io",
  auth: "https://staging.service.oreid.io",
};

/** @type import('oreid-js').OreIdOptions  */
const myOreIdOptions = {
  oreIdUrl: oreIdUrl?.auth,
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
  plugins: { popup: WebPopup() },
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
  /** @type {[OreId, import('react').Dispatch<import('react').SetStateAction<OreId>>]} */
  const [oreId, setOreId] = useState(null);
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

  const createMyOreId = async () => {
    const oreId = new OreId(myOreIdOptions);
    await oreId.init();
    // inject oreId object into window for user accessibility
    // @ts-ignore
    window.oreId = oreId;
    setOreId(oreId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }

  /** Call oreId.login() - this returns a redirect url which will launch the login flow (for the specified provider)
   When complete, the browser will be redirected to the authCallbackUrl (specified in oredId options) */
  const handleLogin = async (provider) => {
    try {
      await oreId.popup.auth({ provider });
      handleUserInfo()
      setLogs({ [Severity.Success]: "Logged In Successfully!" })
    } catch(error) {
      setLogs({ [Severity.Error]: error.errors })
    }
  };

  const handleUserInfo = useCallback(async () => {
    if(!oreId) return
    let userInfo
    try {
      if(oreId.accessToken) userInfo = oreId.auth.user.data;
    } catch (error) {
      await oreId.auth.user.getData();
      userInfo = oreId?.auth.user.data;
    }
    if (userInfo?.accountName) {
      // userInfo.permissions = oreId.auth.user._userSourceData.permissions
      // setUserInfo(Object.freeze(userInfo));
      setIsLoggedIn(true);
      // Save the provider to send in test flows
      setLoggedProvider(oreId.accessTokenHelper?.decodedAccessToken["https://oreid.aikon.com/provider"]);
      return;
    }
    setIsLoggedIn(false);
    // @ts-ignore
    setLoggedProvider(null);
  }, [oreId]);

  /** Remove user info from local storage */
  const handleLogout = () => {
    setIsLoggedIn(false);
    oreId.logout()
    setLogs({ [Severity.Success]: "Logged Out Successfully!" });
    handleUserInfo();
  };

  const handleSignString = async ({ chainNetwork, walletType, onSuccess }) => {
    try {
      const { signedString } = await oreId.signStringWithWallet({
        account: oreId?.auth.user.accountName,
        walletType,
        chainNetwork,
        string: "Verify your Account",
        message: "",
      });
      console.log({ signedString });
      setTimeout(() => {
        handleUserInfo();
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
    try { switch (action) {
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
            provider: loggedProvider,
            allowChainAccountSelection: privateKeyStoredExterally,
            broadcast: true, // if broadcast=true, ore id will broadcast the transaction to the chain network for you
            returnSignedTransaction: false,
            preventAutosign: true, // prevent auto sign even if transaction is auto signable
          },
        };
        const transaction = await oreId.createTransaction(transactionData)
        setWidgetAction(WebWidgetAction.Sign)
        const signedTransaction = await oreId.popup.sign({ transaction })
        handleWidgetSuccess(signedTransaction)
        break
      case WebWidgetAction.NewChainAccount:
        // compose params to create an additional blockchain account
        // IMPORTANT: newAccount is for creating an ADDITIONAL blockchain account for an existing ORE ID wallet - you normally would not need to do this
        setWidgetAction(WebWidgetAction.NewChainAccount)
        const newChainAccount = await oreId.popup.newChainAccount({ chainNetwork: args?.chainNetwork });
        handleWidgetSuccess(newChainAccount)
        break
      case WebWidgetAction.RecoverAccount:
        setWidgetAction(WebWidgetAction.RecoverAccount)
        const response = await oreId.popup.recoverAccount({})
        handleWidgetSuccess(response)
        break
      default:
        return null;
    }} catch (error) {
      handleWidgetError(error)
    }
  };

  /** Set widget properties for selected action */
  const handleAction = async (action, args) => {
    composeWidgetOptionsForAction(action, args);
  };

  useEffect(() => {
    handleUserInfo()
  }, [oreId?.accessToken, handleUserInfo])

  /** Handle the authCallback coming back from ORE ID with an "account" parameter indicating that a user has logged in */
  useEffect(() => {
    createMyOreId()
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
    // @ts-ignore
    setWidgetAction(null);
  };

  const handleWidgetError = (result) => {
    result?.data && console.error(result.data);
    setLogs({ [Severity.Error]: result?.errors || "An error occured" });
    // @ts-ignore
    setWidgetAction(null);
  };

  return (
    <div className={styles.container}>
      {isLoggedIn !== null && (
        <>
          {isLoggedIn ? (
            <UserOreId
              appId={myOreIdOptions.appId}
              oreIdAppUrl={oreIdUrl?.app}
              userInfo={oreId.auth.user.data}
              onAction={handleAction}
              onConnectWallet={handleSignString}
              onLogout={handleLogout}
              onRefresh={() => handleUserInfo()}
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
