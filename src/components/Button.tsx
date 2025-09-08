'use client';

import React from 'react';

function Button({ label } :{ label: string }) {
    return (
        <button className="rounded-4xl border border-black py-3 px-5 flex justify-center items-center h-[44px] text-black font-medium">
            {label}
        </button>
    );
}

export default Button;
