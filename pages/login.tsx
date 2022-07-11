import { ColorTraining } from "app/components/ColorTraining";
import Login from "app/components/Login";
import { HeadSiteMeta } from "app/components/PageContainer";

export default function Page() {
  return (
    <>
      <Login />
      <HeadSiteMeta
        siteMeta={{
          title: "Login",
          description: "Login to Chess Madra",
        }}
      />
    </>
  );
}
