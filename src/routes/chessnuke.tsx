import { onMount } from "solid-js";
import { quick } from "~/utils/app_state";
import { PageWrapper } from "~/components/PageWrapper";
import { useNavigate } from "solid-start";

export default () => {
  const navigate = useNavigate();
  onMount(() => {
    setTimeout(() => {
      navigate("/");
    });
  });
  return <PageWrapper />;
};
