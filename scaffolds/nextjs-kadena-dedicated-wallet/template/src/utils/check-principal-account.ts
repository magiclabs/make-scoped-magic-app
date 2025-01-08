export const checkPrincipalAccount = (accountName: string): boolean => {
  return accountName.startsWith('k:') || accountName.startsWith('r:') || accountName.startsWith('w:');
};
