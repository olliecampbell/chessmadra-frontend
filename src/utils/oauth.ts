import { isServer } from "solid-js/web";

export const LICHESS_CLIENT_ID = "chessbook.com";
export const LICHESS_REDIRECT_URI = `${
  isServer ? "chessbook.com" : window.location.origin
}/oauth/lichess`;
