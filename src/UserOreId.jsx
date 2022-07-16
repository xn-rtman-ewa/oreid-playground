import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { ChainNetwork, ExternalWalletType, WebWidgetAction } from "oreid-js";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import ExitToAppIcon from "@material-ui/icons/ExitToApp";
import AccountBalanceWalletIcon from "@material-ui/icons/AccountBalanceWallet";
import RefreshIcon from "@material-ui/icons/Refresh";
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import {
  Avatar,
  Card,
  CardHeader,
  CardMedia,
  CardActions,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TextField,
  MenuItem,
  TableRow,
  Checkbox,
  InputLabel,
  Select,
  FormControl,
  Button,
  Tooltip,
  Chip,
  Collapse,
  Box,
} from "@material-ui/core";
import transactionTemplate from "./transactionTemplate.json";
import { ReactComponent as OREIDBadge } from "./oreid-badge.svg";

const FormTitle = {
  ConnectWallet: "Connect Wallet",
  ChoosePermission: "Choose Permission",
  ChooseChainNetwork: "Choose Chain Network",
};

const useStyles = makeStyles((theme) => ({
  root: {
    width: "500px",
    position: "relative",
  },
  title: {
    fontSize: 14,
  },
  dappPill: {
    backgroundColor: theme.palette.common.white,
  },
  cardHeader: {
    position: "absolute",
    "& :hover": {
      color: theme.palette.common.white,
      "& $dappPill": {
        backgroundColor: theme.palette.primary.light,
      },
    },
  },
  cardMedia: {
    height: 250,
  },
  cardContent: {
    position: "relative",
  },
  contentActions: {
    textAlign: "end",
  },
  pos: {
    marginBottom: 12,
  },
  label: {
    zIndex: 0,
  },
  form: {
    width: "400px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: theme.spacing(4),
  },
  formControl: {
    margin: theme.spacing(1),
  },
  logout: {
    marginLeft: "auto !important",
    marginRight: 8,
    [theme.breakpoints.down("md")]: {
      marginRight: 0,
    },
  },
  tableRow: {
    "&:nth-of-type(odd)": {
      backgroundColor: theme.palette.action.hover,
    },
  },
  tableHeadRow: {
    whiteSpace: "nowrap",
    backgroundColor: theme.palette.common.black,
    "& th": {
      color: theme.palette.common.white,
    },
  },
  tableSubHeadRow: {
    whiteSpace: "nowrap",
    backgroundColor: theme.palette.text.secondary,
    "& th": {
      color: theme.palette.common.white,
    },
  },
  cardActions: {
    padding: theme.spacing(2),
    gap: theme.spacing(4),
    flexDirection: "column",
  },
  badge: {
    width: "100%",
    textAlign: "center",
    paddingBottom: theme.spacing(2),
  },
}));

/** Show user info and options (after logging in )*/
const UserOreId = (props) => {
  const { userInfo, onAction, onConnectWallet, onLogout, onRefresh, appId, oreIdAppUrl } = props;
  const { accountName, email, name, picture, chainAccounts, username } = userInfo;

  const [selectedPermission, setSelectedPermission] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [chainNetwork, setChainNetwork] = useState(null);
  const [walletType, setWalletType] = useState(null);
  const [transaction, setTransaction] = useState(JSON.stringify(transactionTemplate, null, 4));
  const [openRow, setOpenRow] = React.useState(Array(userInfo.chainAccounts.length).fill(false));

  const styles = useStyles();

  const chainAccountsPermissions = userInfo.chainAccounts.reduce((chainAccountsPermissions, chainAccount) => chainAccountsPermissions.concat([...chainAccount.permissions.map(chainAccountsPermission => ({...chainAccountsPermission, chainAccount: chainAccount.chainAccount}))]), [])

  const handleSelectChainAccountNetwork = (event) => {
    event.preventDefault();
    setOpenDialog(false);
    onAction(WebWidgetAction.NewChainAccount, { chainNetwork });
  };

  const handleSelectPermission = (event) => {
    event.preventDefault();
    setOpenDialog(false);
    onAction(WebWidgetAction.Sign, { chainAccountPermission: userInfo?.chainAccounts.permissions[selectedPermission], transaction });
  };

  const handleConnectWallet = (event) => {
    event.preventDefault();
    onConnectWallet({ chainNetwork, walletType, onSuccess: () => setOpenDialog(false) });
  };

  const handleSelectAction = (event) => {
    const action = event.target.value;
    switch (action) {
      case WebWidgetAction.Sign:
        setDialogTitle(FormTitle.ChoosePermission);
        setOpenDialog(true);
        return;
      case WebWidgetAction.NewChainAccount:
        setDialogTitle(FormTitle.ChooseChainNetwork);
        setOpenDialog(true);
        return;
      default:
        break;
    }
    onAction(action);
  };

  return (
    <Card className={styles.root} variant="outlined">
      <CardHeader
        className={styles.cardHeader}
        subheader={
          <Chip
            className={styles.dappPill}
            label={appId}
            onClick={() => window.open(`${oreIdAppUrl || 'https://oreid.io'}/app/${appId}`, "_blank").focus()}
            color="primary"
            avatar={<Avatar aria-label={name}>{name[0].toUpperCase()}</Avatar>}
            variant="outlined"
          />
        }
      />
      <CardMedia className={styles.cardMedia} image={picture} title={name} />
      <CardContent className={styles.cardContent}>
        <Typography className={styles.title} color="textSecondary" gutterBottom>
          {accountName}
        </Typography>
        <Typography variant="h5" component="h2">
          {name}
        </Typography>
        <Typography className={styles.pos} color="textSecondary">
          {username}
        </Typography>
        <Typography variant="body2" component="p">
          {email}
        </Typography>
        <div className={styles.contentActions}>
          <Tooltip title="Connect Wallet">
            <IconButton
              color="primary"
              aria-label="connect wallet"
              onClick={() => {
                setDialogTitle(FormTitle.ConnectWallet);
                setOpenDialog(true);
              }}
            >
              <AccountBalanceWalletIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh">
            <IconButton color="primary" aria-label="refresh" onClick={() => onRefresh()}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogContent>
              {dialogTitle === FormTitle.ConnectWallet && (
                <form className={styles.form}>
                  <FormControl fullWidth variant="outlined" margin="dense">
                    <InputLabel id="chain-network">Chain Network</InputLabel>
                    <Select
                      label="Chain Network"
                      labelId="chain-network"
                      value={chainNetwork || ""}
                      onChange={(e) => setChainNetwork(e.target.value)}
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {Object.keys(ChainNetwork).map((chainNetwork, index) => (
                        <MenuItem key={index} value={ChainNetwork[chainNetwork]}>
                          {chainNetwork}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth variant="outlined" margin="dense">
                    <InputLabel id="wallet-type">Wallet Type</InputLabel>
                    <Select label="Wallet Type" labelId="wallet-type" value={walletType || ""} onChange={(e) => setWalletType(e.target.value)}>
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {Object.keys(ExternalWalletType).map((externalWalletType, index) => (
                        <MenuItem key={index} value={ExternalWalletType[externalWalletType]}>
                          {externalWalletType}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl margin="dense">
                    <Button variant="contained" color="primary" type="submit" disabled={!chainNetwork || !walletType} onClick={handleConnectWallet}>
                      Connect
                    </Button>
                  </FormControl>
                </form>
              )}
              {dialogTitle === FormTitle.ChoosePermission && (
                <form className={styles.form}>
                  <FormControl color="primary" margin="dense" variant="outlined">
                    <InputLabel id="select-permission">Permission</InputLabel>
                    <Select
                      label="Permission"
                      labelId="select-permission"
                      id="select-permission"
                      value={selectedPermission || ''}
                      onChange={(e) => {
                        setSelectedPermission(e.target.value);
                        setTransaction(JSON.stringify(transactionTemplate, null, 4));
                      }}
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {chainAccountsPermissions.map((chainAccountPermission, i) => (
                        <MenuItem key={i} value={i}>
                          {chainAccountPermission.name}{' '}
                            {chainAccountPermission.publicKey && (
                              <>
                                ({chainAccountPermission.publicKey?.slice(0, 7)}{chainAccountPermission.publicKey?.length > 7 ? '...' : ''})
                              </>
                            )}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {selectedPermission !== null && (
                    <FormControl color="primary" margin="dense" variant="outlined">
                      <TextField
                        margin="dense"
                        label="Chain Account Address"
                        variant="outlined"
                        color="secondary"
                        value={chainAccountsPermissions[selectedPermission].chainAccount}
                      />
                    </FormControl>
                  )}
                  <FormControl color="secondary" margin="dense" variant="outlined">
                    <TextField
                      multiline
                      label="Transaction"
                      variant="outlined"
                      color="secondary"
                      rows="5"
                      value={transaction}
                      onChange={(e) => setTransaction(e.currentTarget.value)}
                    />
                  </FormControl>
                  <FormControl margin="dense">
                    <Button variant="contained" color="primary" type="submit" disabled={selectedPermission === ""} onClick={handleSelectPermission}>
                      Sign with Permission
                    </Button>
                  </FormControl>
                </form>
              )}
              {dialogTitle === FormTitle.ChooseChainNetwork && (
                <form className={styles.form}>
                  <FormControl fullWidth variant="outlined" margin="dense">
                    <InputLabel id="chain-network">Chain Network</InputLabel>
                    <Select
                      label="Chain Network"
                      labelId="chain-network"
                      value={chainNetwork || ""}
                      onChange={(e) => setChainNetwork(e.target.value)}
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {Object.keys(ChainNetwork).map((chainNetwork, index) => (
                        <MenuItem key={index} value={ChainNetwork[chainNetwork]}>
                          {chainNetwork}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl margin="dense">
                    <Button
                      variant="contained"
                      color="primary"
                      type="submit"
                      disabled={chainNetwork === ""}
                      onClick={handleSelectChainAccountNetwork}
                    >
                      Create Chain Account
                    </Button>
                  </FormControl>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
      <CardContent>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1a-content" id="panel1a-header">
            <Typography className={styles.permissions}>Chain Accounts</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <TableContainer>
              <Table className={styles.table} aria-label="permissions table">
                <TableHead>
                  <TableRow className={styles.tableHeadRow}>
                    <TableCell />
                    <TableCell>Address</TableCell>
                    <TableCell>Chain Network</TableCell>
                    <TableCell>Default Permission Name</TableCell>
                    <TableCell>Account Type</TableCell>
                    <TableCell>Verified</TableCell>
                    <TableCell>External Wallet</TableCell>
                    <TableCell>External Private Key</TableCell>
                    <TableCell>Public Key</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {chainAccounts?.map((chainAccount, i) => (
                  <>
                    <TableRow >
                      <TableCell><IconButton aria-label="expand row" size="small" onClick={() => setOpenRow(openRow => ({...openRow, [i]: !openRow[i]}))}>
                        {openRow[i] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                      </IconButton></TableCell>
                      <TableCell component="th" scope="row">{chainAccount.chainAccount}</TableCell>
                      <TableCell component="th" scope="row">{chainAccount.chainNetwork}</TableCell>
                      <TableCell align="center">{chainAccount.defaultPermission.name}</TableCell>
                      <TableCell align="center">{chainAccount.defaultPermission.accountType}</TableCell>
                      <TableCell align="center" padding="checkbox">
                        <Checkbox disabled checked={chainAccount.defaultPermission.isVerified || false} />
                      </TableCell>
                      <TableCell align="center">{chainAccount.defaultPermission.externalWalletType}</TableCell>
                      <TableCell align="center" padding="checkbox">
                        <Checkbox disabled checked={chainAccount.defaultPermission.privateKeyStoredExterally || false} />
                      </TableCell>
                      <TableCell align="left">{chainAccount.defaultPermission.publicKey}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                        <Collapse in={openRow[i]} timeout="auto" unmountOnExit>
                          <Box margin={1}>
                            <Typography variant="h6" gutterBottom component="div">
                              Permissions
                            </Typography>
                            <Table size="small" aria-label="purchases">
                              <TableHead>
                                <TableRow className={styles.tableSubHeadRow}>
                                  <TableCell>Name</TableCell>
                                  <TableCell>Account Type</TableCell>
                                  <TableCell>Verified</TableCell>
                                  <TableCell>External Wallet</TableCell>
                                  <TableCell>External Private Key</TableCell>
                                  <TableCell>Public Key</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {chainAccount.permissions.map((chainAccountPermission, j) => (
                                  <TableRow key={`${i}-${j}`}>
                                    <TableCell component="th" scope="row">
                                      {chainAccountPermission.name || ''}
                                    </TableCell>
                                    <TableCell align="center">{chainAccountPermission.accountType}</TableCell>
                                    <TableCell align="center" padding="checkbox">
                                      <Checkbox disabled checked={chainAccountPermission.isVerified || false} />
                                    </TableCell>
                                    <TableCell align="center">{chainAccountPermission.externalWalletType}</TableCell>
                                    <TableCell align="center" padding="checkbox">
                                      <Checkbox disabled checked={chainAccountPermission.privateKeyStoredExterally || false} />
                                    </TableCell>
                                    <TableCell align="left">{chainAccountPermission.publicKey}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>
      </CardContent>
      <CardActions className={styles.cardActions}>
        <FormControl fullWidth color="primary" margin="dense" variant="outlined" className={styles.formControl}>
          <InputLabel className={styles.label} id="widget-action">
            Widget Action
          </InputLabel>
          <Select labelId="widget-action" id="select-outlined" label="Widget Action" defaultValue="" onChange={handleSelectAction}>
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            <MenuItem value={WebWidgetAction.Sign}>Sign</MenuItem>
            <MenuItem value={WebWidgetAction.NewChainAccount}>New Chain Account</MenuItem>
            <MenuItem value={WebWidgetAction.RecoverAccount}>Recover Account (Reset Password/Pin)</MenuItem>
          </Select>
        </FormControl>
        <Button endIcon={<ExitToAppIcon />} className={styles.logout} onClick={onLogout} variant="outlined" color="secondary">
          Logout
        </Button>
      </CardActions>
      <div className={styles.badge}>
        <OREIDBadge />
      </div>
    </Card>
  );
};

export default UserOreId;
