import { LoginSidebar } from "~/components/LoginSidebar";
import PageWrapper from "./[...404]";

export default () => {
  // @ts-ignore
  return <PageWrapper initialView={LoginSidebar} />;
};
