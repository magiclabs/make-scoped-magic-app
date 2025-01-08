import { literal, readKeyset } from '@kadena/client';
import { checkPrincipalAccount } from './check-principal-account';
import { accountProtocol } from './account-protocol';

export const accountGuard = (accountName: string) => {
  if (checkPrincipalAccount(accountName)) {
    if (accountProtocol(accountName) === 'r:') {
      return literal(`(keyset-ref-guard "${accountName.substring(2)}")`);
    } else {
      return readKeyset('receiverKeyset');
    }
  } else {
    return readKeyset('receiverKeyset');
  }
};
