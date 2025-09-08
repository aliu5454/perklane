// ExampleComponent.tsx
export default function BGTexture() {
    return (
        <div className="bg-container absolute inset-0 overflow-hidden h-screen w-screen">
            <div
                className="absolute inset-0"
                style={{
                    mask: "linear-gradient(0deg, rgba(0, 0, 0, 0) 0%, rgb(0, 0, 0) 100%)",
                    mixBlendMode: "overlay"
                }}
            >
                <div
                    data-framer-background-image-wrapper="true"
                    style={{
                        position: "absolute",
                        borderRadius: "inherit",
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0,
                        backgroundImage:
                            "url(https://framerusercontent.com/images/6mcf62RlDfRfU61Yg5vb2pefpi4.png)",
                        backgroundRepeat: "repeat",
                        backgroundPosition: "left top",
                        border: 0,
                        backgroundSize: "128px auto",
                    }}
                />
            </div>

            <div className="stripe-container bg-[#f4f2ee] relative h-full w-full flex justify-between items-center"
                 style={{
                     mask: "linear-gradient(0deg, rgba(0, 0, 0, 0) 0%, rgb(0, 0, 0) 100%)"
                 }}
            >
                <div className="stripe-left"
                     style={{
                         mask: "linear-gradient(270deg, rgba(0, 0, 0, 0) 0%, rgb(0, 0, 0) 100%)"
                     }}
                >
                    {Array.from({length: 8}).map((_, i) => (
                        <div
                            key={`left-${i}`}
                            className="max-w-[82px] min-w-[70px] w-px h-full"
                            style={{
                                background:
                                    "linear-gradient(90.0001deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0) 100%)",
                                opacity: 1,
                            }}
                        />
                    ))}
                </div>

                <div className="stripe-right"
                     style={{
                         mask: "linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, rgb(0, 0, 0) 100%)"
                     }}
                >
                    {Array.from({length: 8}).map((_, i) => (
                        <div
                            key={`right-${i}`}
                            className="max-w-[82px] min-w-[70px] w-px h-full"
                            style={{
                                background:
                                    "linear-gradient(90.0001deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0) 100%)",
                                opacity: 1,
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
