import React from 'react';

function ChartLine() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><polyline points="224 208 32 208 32 48" fill="none" stroke="currentColor" strokeLinecap="round" stroke-linejoin="round" stroke-width="16"/><polyline points="224 96 160 152 96 104 32 160" fill="none" stroke="currentColor" strokeLinecap="round" stroke-linejoin="round" stroke-width="16"/></svg>    );
}

function Laptop() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><path d="M40,176V72A16,16,0,0,1,56,56H200a16,16,0,0,1,16,16V176" fill="none" stroke="currentColor" strokeLinecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M24,176H232a0,0,0,0,1,0,0v16a16,16,0,0,1-16,16H40a16,16,0,0,1-16-16V176A0,0,0,0,1,24,176Z" fill="none" stroke="currentColor" strokeLinecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="144" y1="88" x2="112" y2="88" fill="none" stroke="currentColor" strokeLinecap="round" stroke-linejoin="round" stroke-width="16"/></svg>    );
}

function Stack() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><polyline points="32 176 128 232 224 176" fill="none" stroke="currentColor" strokeLinecap="round" stroke-linejoin="round" stroke-width="16"/><polyline points="32 128 128 184 224 128" fill="none" stroke="currentColor" strokeLinecap="round" stroke-linejoin="round" stroke-width="16"/><polygon points="32 80 128 136 224 80 128 24 32 80" fill="none" stroke="currentColor" strokeLinecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
    );
}

function UserList() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><circle cx="80" cy="104" r="40" fill="none" stroke="currentColor" strokeLinecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="160" y1="80" x2="248" y2="80" fill="none" stroke="currentColor" strokeLinecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="160" y1="128" x2="248" y2="128" fill="none" stroke="currentColor" strokeLinecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="184" y1="176" x2="248" y2="176" fill="none" stroke="currentColor" strokeLinecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M16,192c7.1-27.6,34.18-48,64-48s56.9,20.4,64,48" fill="none" stroke="currentColor" strokeLinecap="round" stroke-linejoin="round" stroke-width="16"/></svg>    );
}

function ArrowRight() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><line x1="40" y1="128" x2="216" y2="128" fill="none" stroke="currentColor" strokeLinecap="round" stroke-linejoin="round" stroke-width="16"/><polyline points="144 56 216 128 144 200" fill="none" stroke="currentColor" strokeLinecap="round" stroke-linejoin="round" stroke-width="16"/></svg>    );
}

function ArrowRightBend() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><polyline points="176 104 224 152 176 200" fill="none" stroke="currentColor" strokeLinecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M32,56a96,96,0,0,0,96,96h96" fill="none" stroke="currentColor" strokeLinecap="round" stroke-linejoin="round" stroke-width="16"/></svg>    );
}

function Plus() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><line x1="40" y1="128" x2="216" y2="128" fill="none" stroke="currentColor" strokeLinecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="128" y1="40" x2="128" y2="216" fill="none" stroke="currentColor" strokeLinecap="round" stroke-linejoin="round" stroke-width="16"/></svg>    );
}

export {
    ArrowRight,
    ArrowRightBend,
    ChartLine,
    Laptop,
    Plus,
    Stack,
    UserList,
};
