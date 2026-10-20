package com.amberhall.mod;

import net.minecraft.block.BlockState;
import net.minecraft.block.ChestBlock;
import net.minecraft.block.entity.BlockEntity;
import net.minecraft.util.math.BlockPos;

public class WoodChestBlock extends ChestBlock {
	public final String wood;

	public WoodChestBlock(String wood, Settings settings) {
		super(settings, () -> ModChests.BLOCK_ENTITY);
		this.wood = wood;
	}

	@Override
	public BlockEntity createBlockEntity(BlockPos pos, BlockState state) {
		return new WoodChestBlockEntity(pos, state);
	}
}
