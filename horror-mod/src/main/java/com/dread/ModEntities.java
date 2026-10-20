package com.dread;

import net.fabricmc.fabric.api.object.builder.v1.entity.FabricDefaultAttributeRegistry;
import net.minecraft.entity.EntityType;
import net.minecraft.entity.SpawnGroup;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;

public final class ModEntities {
	public static final EntityType<WatcherEntity> WATCHER = Registry.register(Registries.ENTITY_TYPE, DreadMod.id("watcher"),
		EntityType.Builder.create(WatcherEntity::new, SpawnGroup.MONSTER).dimensions(0.6f, 2.4f).maxTrackingRange(16).build("watcher"));

	public static final EntityType<CrawlerEntity> CRAWLER = Registry.register(Registries.ENTITY_TYPE, DreadMod.id("crawler"),
		EntityType.Builder.create(CrawlerEntity::new, SpawnGroup.MONSTER).dimensions(1.1f, 0.9f).maxTrackingRange(10).build("crawler"));
	public static final EntityType<SmileEntity> SMILE = Registry.register(Registries.ENTITY_TYPE, DreadMod.id("smile"),
		EntityType.Builder.create(SmileEntity::new, SpawnGroup.MONSTER).dimensions(0.9f, 0.9f).maxTrackingRange(16).build("smile"));

	public static void init() {
		FabricDefaultAttributeRegistry.register(CRAWLER, CrawlerEntity.createAttributes());
		FabricDefaultAttributeRegistry.register(SMILE, SmileEntity.createAttributes());
		FabricDefaultAttributeRegistry.register(WATCHER, WatcherEntity.createAttributes());
	}
}
