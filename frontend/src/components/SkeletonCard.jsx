import { useState } from 'react';
import './SkeletonCard.css';

/**
 * Generic skeleton card for loading states.
 * Replaces spinning loaders with a more modern shimmer effect.
 *
 * Props:
 *   type: 'property' | 'booking' | 'payment' | 'message' | 'generic'
 *   count: number of skeleton items to render (default 3)
 */
export function SkeletonCard({ type = 'generic', count = 3 }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className={`skeleton-card skeleton-${type}`}>
                    {type === 'property' && <PropertySkeleton />}
                    {type === 'booking' && <BookingSkeleton />}
                    {type === 'payment' && <PaymentSkeleton />}
                    {type === 'message' && <MessageSkeleton />}
                    {type === 'generic' && <GenericSkeleton />}
                </div>
            ))}
        </>
    );
}

function PropertySkeleton() {
    return (
        <>
            <div className="sk sk-image" />
            <div className="sk-body">
                <div className="sk sk-title" />
                <div className="sk sk-sub" />
                <div className="sk sk-row">
                    <div className="sk sk-badge" />
                    <div className="sk sk-badge" />
                </div>
                <div className="sk sk-price" />
            </div>
        </>
    );
}

function BookingSkeleton() {
    return (
        <div className="sk-body">
            <div className="sk sk-title" />
            <div className="sk sk-sub" />
            <div className="sk sk-row">
                <div className="sk sk-badge" />
                <div className="sk sk-badge w-half" />
            </div>
        </div>
    );
}

function PaymentSkeleton() {
    return (
        <div className="sk-body sk-row-spread">
            <div>
                <div className="sk sk-title w-half" />
                <div className="sk sk-sub w-quarter" />
            </div>
            <div className="sk sk-price" />
        </div>
    );
}

function MessageSkeleton() {
    return (
        <div className="sk-row sk-body">
            <div className="sk sk-avatar" />
            <div style={{ flex: 1 }}>
                <div className="sk sk-title w-third" />
                <div className="sk sk-sub" />
            </div>
        </div>
    );
}

function GenericSkeleton() {
    return (
        <div className="sk-body">
            <div className="sk sk-title" />
            <div className="sk sk-sub" />
            <div className="sk sk-sub w-half" />
        </div>
    );
}

/**
 * Lazy-loading image wrapper.
 * Uses the native `loading="lazy"` attribute + a shimmer placeholder
 * that fades out once the image loads.
 */
export function LazyImage({ src, alt, className = '', style = {} }) {
    const [loaded, setLoaded] = useState(false);

    return (
        <div className={`lazy-img-wrap ${className}`} style={style}>
            {!loaded && <div className="lazy-placeholder sk" />}
            <img
                src={src}
                alt={alt}
                loading="lazy"
                decoding="async"
                onLoad={() => setLoaded(true)}
                style={{
                    opacity: loaded ? 1 : 0,
                    transition: 'opacity 0.3s ease',
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                }}
            />
        </div>
    );
}
