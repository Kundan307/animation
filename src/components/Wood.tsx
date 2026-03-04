import React from 'react';

export default function Wood(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1161.62 601.49" preserveAspectRatio="xMidYMax meet" {...props}>
            <defs>
                <style dangerouslySetInnerHTML={{ __html: ".wood-cls-1{fill:#bc822b;}" }} />
            </defs>
            {/* Single thin plank — sized to ride on the forklift forks */}
            <rect className="wood-cls-1" x="490" y="318" width="220" height="16" rx="2" />
        </svg>
    );
}
