package com.amberhall.mod;

import net.minecraft.entity.LivingEntity;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.item.Item;
import net.minecraft.item.ItemStack;
import net.minecraft.item.Items;
import net.minecraft.world.World;

public class GlowStewItem extends Item {
	public GlowStewItem(Settings settings) {
		super(settings);
	}

	@Override
	public ItemStack finishUsing(ItemStack stack, World world, LivingEntity user) {
		ItemStack result = super.finishUsing(stack, world, user);
		if (user instanceof PlayerEntity p && p.isInCreativeMode()) return result;
		return result.isEmpty() ? new ItemStack(Items.BOWL) : result;
	}
}
