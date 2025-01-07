import { checkPrincipalAccount } from './check-principal-account';

export const accountProtocol = (accountName: string) => {
  if (checkPrincipalAccount(accountName)) {
    return accountName.substring(0, 2);
  }
  return null;
};
