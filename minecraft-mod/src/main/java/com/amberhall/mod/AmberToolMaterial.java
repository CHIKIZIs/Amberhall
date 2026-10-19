package com.amberhall.mod;

import net.minecraft.block.Block;
import net.minecraft.item.ToolMaterial;
import net.minecraft.recipe.Ingredient;
import net.minecraft.registry.tag.BlockTags;
import net.minecraft.registry.tag.TagKey;

/** Янтарь: чуть лучше железа по урону и зачарованию, но хрупче. */
public final class AmberToolMaterial implements ToolMaterial {
	public static final AmberToolMaterial INSTANCE = new AmberToolMaterial();

	private AmberToolMaterial() {
	}

	@Override
	public int getDurability() {
		return 400;
	}

	@Override
	public float getMiningSpeedMultiplier() {
		return 7.0f;
	}

	@Override
	public float getAttackDamage() {
		return 2.5f;
	}

	@Override
	public TagKey<Block> getInverseTag() {
		return BlockTags.INCORRECT_FOR_IRON_TOOL;
	}

	@Override
	public int getEnchantability() {
		return 18;
	}

	@Override
	public Ingredient getRepairIngredient() {
		return Ingredient.ofItems(ModItems.AMBER_GEM);
	}
}
