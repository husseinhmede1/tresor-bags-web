import { Backpack, Handbag, Suitcase, Wallet } from "@phosphor-icons/react";

// The store's four main categories, in menu order. Bags and types are tagged with these titles.
export const SHOP_CATEGORIES = [
    { title: "Luggage",     sub: "Carry-ons, checked, trolleys",  Icon: Suitcase },
    { title: "Backpacks",   sub: "Travel, laptop, active packs",  Icon: Backpack },
    { title: "Bags",        sub: "Totes, crossbody, duffels",     Icon: Handbag },
    { title: "Accessories", sub: "Wallets, tech, packing & more", Icon: Wallet },
];
