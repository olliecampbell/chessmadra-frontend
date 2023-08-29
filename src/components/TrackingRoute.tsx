import { onMount } from "solid-js";
import { PageWrapper } from "~/components/PageWrapper";
import { useNavigate } from "solid-start";
import { trackEvent } from "~/utils/trackEvent";

export default () => {
  const navigate = useNavigate();
  onMount(() => {
    setTimeout(() => {
      navigate("/");
    });
  });
  return <PageWrapper />;
};
