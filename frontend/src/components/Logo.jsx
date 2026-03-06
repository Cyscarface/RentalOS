export default function Logo({ className = '', style = {}, size = 36 }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 300 300"
            width={size}
            height={size}
            className={className}
            style={style}
        >
            <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#66FCF1" />
                    <stop offset="100%" stopColor="#45A29E" />
                </linearGradient>
            </defs>

            {/* Base Rounded Square */}
            <rect width="300" height="300" rx="64" fill="url(#logoGrad)" />

            {/* Stylized Modern 'R' / Architecture shape */}
            <path
                d="M100 210V90H150C183.137 90 210 116.863 210 150C210 178.618 190.009 202.551 163.411 208.536L210 210H165L128.536 173.536H130V210H100Z"
                fill="#0B0C10"
            />
            {/* Inner Cutout for the 'R' */}
            <path
                d="M130 115V150H150C163.807 150 175 138.807 175 125C175 111.193 163.807 115 150 115H130Z"
                fill="url(#logoGrad)"
            />

            {/* Dynamic Building Accent */}
            <polygon points="170,150 210,190 210,150" fill="#0B0C10" opacity="0.2" />
        </svg>
    );
}
