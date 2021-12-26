import { useState, useEffect } from 'react'

export default function useIntersection(element: any, rootMargin: any) {
    const [isVisible, setState] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setState(entry.isIntersecting);
            }, { rootMargin }
        );

        element && observer.observe(element);

        return () => element && observer.unobserve(element);
    }, [element, rootMargin]);

    return isVisible;
};
