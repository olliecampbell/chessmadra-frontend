import { clsx } from "~/utils/classes"

export const LoadingSpinner = (props: {class?: string}) => {
    return <div>
    <i class={clsx("fa fa-circle-notch animate-spin", props.class)} />
    </div>
  }
