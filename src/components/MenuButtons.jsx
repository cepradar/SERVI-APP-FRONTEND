// src/components/MenuButtons.js
import React from "react";

export default function MenuButtons({ activeModule, onProductsClick, onCategoriesClick, onCreateUserClick, onEditUserClick }) {
  if (activeModule === 'inventory' || activeModule === 'users') {
    return null;
  }

  return null;
}