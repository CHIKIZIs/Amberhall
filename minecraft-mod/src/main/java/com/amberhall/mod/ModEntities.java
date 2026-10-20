package com.amberhall.mod;

import net.fabricmc.fabric.api.object.builder.v1.entity.FabricDefaultAttributeRegistry;
import net.minecraft.entity.EntityType;
import net.minecraft.entity.SpawnGroup;
import net.minecraft.entity.SpawnLocationTypes;
import net.minecraft.entity.SpawnRestriction;
import net.minecraft.entity.mob.HostileEntity;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.world.Heightmap;

public final class ModEntities {
	public static final EntityType<StalkerEntity> STALKER = Registry.register(Registries.ENTITY_TYPE,
		AmberhallMod.id("stalker"),
		EntityType.Builder.create(StalkerEntity::new, SpawnGroup.MONSTER)
			.dimensions(0.7f, 2.0f)
			.maxTrackingRange(8)
			.build("stalker"));

	public static void init() {
		FabricDefaultAttributeRegistry.register(STALKER, StalkerEntity.createAttributes());
		// как зомби и скелеты: в темноте на твёрдой земле
		SpawnRestriction.register(STALKER, SpawnLocationTypes.ON_GROUND, Heightmap.Type.MOTION_BLOCKING_NO_LEAVES,
			HostileEntity::canSpawnInDark);
	}
}
