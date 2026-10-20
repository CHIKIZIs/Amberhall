package com.amberhall.mod;

import net.minecraft.block.BlockState;
import net.minecraft.block.entity.ChestBlockEntity;
import net.minecraft.util.math.BlockPos;

public class WoodChestBlockEntity extends ChestBlockEntity {
	public WoodChestBlockEntity(BlockPos pos, BlockState state) {
		super(ModChests.BLOCK_ENTITY, pos, state);
	}

	/** вид дерева — для выбора текстуры на клиенте */
	public String wood() {
		return getCachedState().getBlock() instanceof WoodChestBlock chest ? chest.wood : "oak";
	}
}
