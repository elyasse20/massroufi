
export const mapFirebaseError = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/invalid-email':
      return 'auth.error_invalid_email';
    case 'auth/user-disabled':
      return 'auth.error_user_disabled';
    case 'auth/user-not-found':
      return 'auth.error_user_not_found';
    case 'auth/wrong-password':
      return 'auth.error_wrong_password';
    case 'auth/email-already-in-use':
      return 'auth.error_email_in_use';
    case 'auth/weak-password':
      return 'auth.error_weak_password';
    case 'auth/invalid-credential':
      return 'auth.error_invalid_credential';
    case 'auth/operation-not-allowed':
      return 'auth.error_operation_not_allowed';
    case 'auth/network-request-failed':
        return 'auth.error_network';
    default:
      return 'auth.error_unknown';
  }
};
