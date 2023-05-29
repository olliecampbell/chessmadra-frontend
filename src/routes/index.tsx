import { ChessMadra } from "~/components/ChessMadra";
import { PageWrapper } from "~/components/PageWrapper";
import { isChessmadra } from "~/utils/env";

export default isChessmadra ? ChessMadra : PageWrapper;
