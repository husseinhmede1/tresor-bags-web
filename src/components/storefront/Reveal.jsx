import { useEffect, useRef } from "react";

// Fades its child up once when it scrolls into view (see .sf-reveal in storefront.css).
export default function Reveal({ children, index = 0, as: Tag = "div", className = "", ...rest }) {
    const ref = useRef(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const io = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return;
            el.style.transitionDelay = `${(index % 4) * 60}ms`;
            el.classList.add("is-in");
            io.disconnect();
        }, { threshold: 0.1 });
        io.observe(el);
        return () => io.disconnect();
    }, [index]);
    return <Tag ref={ref} className={`sf-reveal ${className}`} {...rest}>{children}</Tag>;
}
