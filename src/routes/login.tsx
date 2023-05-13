import { LoginSidebar } from "~/components/LoginSidebar";
import PageWrapper from "./[...404]";

export default () => {
  return <PageWrapper initialView={LoginSidebar} />;
};
