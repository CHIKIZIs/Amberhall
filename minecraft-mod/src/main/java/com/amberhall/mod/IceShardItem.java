package com.amberhall.mod;

import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.item.Item;
import net.minecraft.item.ItemStack;
import net.minecraft.sound.SoundCategory;
import net.minecraft.sound.SoundEvents;
import net.minecraft.stat.Stats;
import net.minecraft.util.Hand;
import net.minecraft.util.TypedActionResult;
import net.minecraft.world.World;

/** Ледяной осколок: на правую кнопку метается во врага, как снежок, но ранит и замораживает. */
public class IceShardItem extends Item {
	public IceShardItem(Settings settings) {
		super(settings);
	}

	@Override
	public TypedActionResult<ItemStack> use(World world, PlayerEntity user, Hand hand) {
		ItemStack stack = user.getStackInHand(hand);
		world.playSound(null, user.getX(), user.getY(), user.getZ(), SoundEvents.ENTITY_SNOWBALL_THROW, SoundCategory.NEUTRAL, 0.6f, 1.6f);
		if (!world.isClient) {
			IceShardEntity shard = new IceShardEntity(world, user);
			shard.setVelocity(user, user.getPitch(), user.getYaw(), 0.0f, 2.0f, 0.8f);
			world.spawnEntity(shard);
		}
		user.incrementStat(Stats.USED.getOrCreateStat(this));
		stack.decrementUnlessCreative(1, user);
		user.getItemCooldownManager().set(this, 8);
		return TypedActionResult.success(stack, world.isClient());
	}
}
