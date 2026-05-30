import { forwardRef, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

type SecureStreamVideoProps = ComponentProps<"video"> & {
  wrapperClassName?: string;
};

/** HTML5 player without browser download / PiP menu items (streaming only). */
export const SecureStreamVideo = forwardRef<HTMLVideoElement, SecureStreamVideoProps>(
  function SecureStreamVideo(
    { className, wrapperClassName, onContextMenu, ...props },
    ref,
  ) {
    return (
      <div
        className={cn("relative", wrapperClassName)}
        onContextMenu={(e) => {
          e.preventDefault();
          onContextMenu?.(e);
        }}
      >
        <video
          ref={ref}
          {...props}
          controlsList="nodownload noremoteplayback"
          disablePictureInPicture
          controls={props.controls ?? true}
          className={cn("mx-auto block w-full max-w-full bg-black object-contain", className)}
        />
      </div>
    );
  },
);
