import { registerInDevtools, Store } from "pullstate";
import { User } from "./models";

export enum AuthStatus {
  Authenticated = "Authenticated",
  Unauthenticated = "Unauthenticated",
  Initial = "Initial",
  Authenticating = "Authenticating",
}

type AppStore = {
  lichessAuthToken: string;
  auth: {
    token?: string;
    user?: User;
    authStatus: AuthStatus;
    tempUserUuid?: string;
  };
};

export const AppStore = new Store({
  lichessAuthToken: null,
  auth: {
    token: undefined,
    user: undefined,
    authStatus: AuthStatus.Initial,
  },
} as AppStore);

registerInDevtools({
  AppStore,
});
