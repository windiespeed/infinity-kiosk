import { useCallback, useEffect, useRef, useState } from "react";
import {
    TransformComponent,
    TransformWrapper,
} from "react-zoom-pan-pinch";
import { useDialog } from "../hooks/useDialog.js";

export default function ImageViewer({
    images = [],
    initialIndex = 0,
    mediaUrl,
    onClose,
}) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [zoom, setZoom] = useState(1);
    const [reduceMotion, setReduceMotion] = useState(false);

    const transformRef = useRef(null);
    const dialogRef = useDialog(onClose);

    const currentImage = images[currentIndex];

    const hasPrevious = currentIndex > 0;
    const hasNext = currentIndex < images.length - 1;

    useEffect(() => {
        const mediaQuery = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        );

        const updateMotionPreference = () => {
            setReduceMotion(mediaQuery.matches);
        };

        updateMotionPreference();

        mediaQuery.addEventListener?.(
            "change",
            updateMotionPreference
        );

        return () => {
            mediaQuery.removeEventListener?.(
                "change",
                updateMotionPreference
            );
        };
    }, []);

    const resetZoom = useCallback(() => {
        const instance = transformRef.current;

        if (!instance) {
            return;
        }

        instance.resetTransform(reduceMotion ? 0 : 200);
        setZoom(1);
    }, [reduceMotion]);

    const zoomIn = useCallback(() => {
        const instance = transformRef.current;

        if (!instance) {
            return;
        }

        if (reduceMotion) {
            const nextScale = Math.min(instance.state.scale + 1, 5);

            instance.setTransform(
                instance.state.positionX,
                instance.state.positionY,
                nextScale,
                0
            );
        } else {
            instance.zoomIn(1, 200);
        }
    }, [reduceMotion]);

    const zoomOut = useCallback(() => {
        const instance = transformRef.current;

        if (!instance) {
            return;
        }

        if (reduceMotion) {
            const nextScale = Math.max(instance.state.scale - 1, 1);

            instance.setTransform(
                instance.state.positionX,
                instance.state.positionY,
                nextScale,
                0
            );
        } else {
            instance.zoomOut(1, 200);
        }
    }, [reduceMotion]);

    const changeImage = useCallback(
        (newIndex) => {
            if (newIndex < 0 || newIndex >= images.length) {
                return;
            }

            setCurrentIndex(newIndex);

            requestAnimationFrame(() => {
                transformRef.current?.resetTransform(0);
                setZoom(1);
            });
        },
        [images.length]
    );

    const goPrevious = useCallback(() => {
        if (zoom !== 1 || !hasPrevious) {
            return;
        }

        changeImage(currentIndex - 1);
    }, [
        changeImage,
        currentIndex,
        hasPrevious,
        zoom,
    ]);

    const goNext = useCallback(() => {
        if (zoom !== 1 || !hasNext) {
            return;
        }

        changeImage(currentIndex + 1);
    }, [
        changeImage,
        currentIndex,
        hasNext,
        zoom,
    ]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (!dialogRef.current) {
                return;
            }

            const target = event.target;

            if (
                target instanceof HTMLInputElement ||
                target instanceof HTMLTextAreaElement ||
                target instanceof HTMLSelectElement
            ) {
                return;
            }

            if (event.key === "+" || event.key === "=") {
                event.preventDefault();
                zoomIn();
                return;
            }

            if (event.key === "-" || event.key === "_") {
                event.preventDefault();
                zoomOut();
                return;
            }

            if (event.key === "0") {
                event.preventDefault();
                resetZoom();
                return;
            }

            if (event.key === "ArrowLeft") {
                event.preventDefault();

                if (zoom === 1) {
                    goPrevious();
                }

                return;
            }

            if (event.key === "ArrowRight") {
                event.preventDefault();

                if (zoom === 1) {
                    goNext();
                }

                return;
            }

            if (
                event.key === "ArrowUp" ||
                event.key === "ArrowDown"
            ) {
                if (zoom !== 1) {
                    event.preventDefault();
                }
            }
        };

        document.addEventListener(
            "keydown",
            handleKeyDown
        );

        return () => {
            document.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };
    }, [
        dialogRef,
        goNext,
        goPrevious,
        resetZoom,
        zoom,
        zoomIn,
        zoomOut,
    ]);

    if (!currentImage) {
        return null;
    }

    const imageUrl = mediaUrl(currentImage);

    const caption =
        currentImage.caption ||
        currentImage.title ||
        "";

    const credit =
        currentImage.credit ||
        currentImage.credits ||
        "";

    return (
        <div
            ref={dialogRef}
            className="fixed inset-0 z-[100] flex flex-col bg-black/95 text-white"
            role="dialog"
            aria-modal="true"
            aria-label="Image viewer"
        >
            <div className="flex items-center justify-between px-4 py-3">
                <span
                    className="text-sm"
                    aria-live="polite"
                >
                    {images.length > 1
                        ? `${currentIndex + 1} of ${images.length}`
                        : "Image"}
                </span>

                <button
                    type="button"
                    onClick={onClose}
                    data-autofocus
                    className="rounded-xl px-5 py-3 text-lg font-semibold hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
                    aria-label="Close image viewer"
                >
                    Close
                </button>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden">
                <TransformWrapper
                    ref={transformRef}
                    initialScale={1}
                    minScale={1}
                    maxScale={5}
                    centerOnInit
                    disablePadding={false}
                    doubleClick={{
                        mode: "zoomIn",
                        step: 1,
                        animationTime: reduceMotion ? 0 : 200,
                    }}
                    pinch={{
                        disabled: false,
                    }}
                    panning={{
                        disabled: false,
                    }}
                    wheel={{
                        disabled: false,
                        step: 0.5,
                    }}
                    onTransformed={(ref) => {
                        setZoom(ref.state.scale);
                    }}
                >
                    <TransformComponent
                        wrapperStyle={{
                            width: "100%",
                            height: "100%",
                        }}
                        contentStyle={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <img
                            src={imageUrl}
                            alt={
                                currentImage.alt ||
                                caption ||
                                "Full-screen image"
                            }
                            className="max-h-full max-w-full select-none object-contain"
                            draggable="false"
                        />
                    </TransformComponent>
                </TransformWrapper>
            </div>

            <div className="px-4 py-3 text-center">
                {caption && (
                    <p className="text-base font-medium">
                        {caption}
                    </p>
                )}

                {credit && (
                    <p className="mt-1 text-sm text-white/70">
                        Credit: {credit}
                    </p>
                )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 px-4 pb-5">
                {images.length > 1 && (
                    <>
                        <button
                            type="button"
                            onClick={goPrevious}
                            disabled={!hasPrevious || zoom !== 1}
                            className="min-w-16 rounded-xl px-5 py-4 text-2xl font-bold hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Previous image"
                        >
                            ←
                        </button>

                        <button
                            type="button"
                            onClick={goNext}
                            disabled={!hasNext || zoom !== 1}
                            className="min-w-16 rounded-xl px-5 py-4 text-2xl font-bold hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Next image"
                        >
                            →
                        </button>
                    </>
                )}

                <button
                    type="button"
                    onClick={zoomOut}
                    className="min-w-16 rounded-xl px-5 py-4 text-3xl font-bold hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
                    aria-label="Zoom out"
                >
                    −
                </button>

                <span
                    className="min-w-20 rounded-xl px-4 py-4 text-center text-lg font-semibold"
                    aria-live="polite"
                >
                    {Math.round(zoom)}×
                </span>

                <button
                    type="button"
                    onClick={zoomIn}
                    className="min-w-16 rounded-xl px-5 py-4 text-3xl font-bold hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
                    aria-label="Zoom in"
                >
                    +
                </button>

                <button
                    type="button"
                    onClick={resetZoom}
                    className="rounded-xl px-5 py-4 text-lg font-semibold hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
                    aria-label="Reset zoom"
                >
                    Reset
                </button>
            </div>
        </div>
    );
}

