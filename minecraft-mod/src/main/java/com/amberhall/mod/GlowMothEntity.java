package com.amberhall.mod;

import net.minecraft.entity.EntityType;
import net.minecraft.entity.ai.control.FlightMoveControl;
import net.minecraft.entity.ai.goal.EscapeDangerGoal;
import net.minecraft.entity.ai.goal.FlyGoal;
import net.minecraft.entity.ai.goal.LookAroundGoal;
import net.minecraft.entity.ai.pathing.BirdNavigation;
import net.minecraft.entity.ai.pathing.EntityNavigation;
import net.minecraft.entity.attribute.DefaultAttributeContainer;
import net.minecraft.entity.attribute.EntityAttributes;
import net.minecraft.entity.mob.MobEntity;
import net.minecraft.entity.mob.PathAwareEntity;
import net.minecraft.world.World;

/** Светящийся мотылёк: мирный ночной летун светящейся чащи, мягко порхает у земли и деревьев. */
public class GlowMothEntity extends PathAwareEntity {
	public GlowMothEntity(EntityType<? extends GlowMothEntity> type, World world) {
		super(type, world);
		this.moveControl = new FlightMoveControl(this, 20, true);
	}

	public static DefaultAttributeContainer.Builder createAttributes() {
		return MobEntity.createMobAttributes()
			.add(EntityAttributes.GENERIC_MAX_HEALTH, 4.0)
			.add(EntityAttributes.GENERIC_FLYING_SPEED, 0.5)
			.add(EntityAttributes.GENERIC_MOVEMENT_SPEED, 0.15)
			.add(EntityAttributes.GENERIC_FOLLOW_RANGE, 16.0);
	}

	@Override
	protected EntityNavigation createNavigation(World world) {
		BirdNavigation navigation = new BirdNavigation(this, world);
		navigation.setCanPathThroughDoors(false);
		navigation.setCanSwim(false);
		return navigation;
	}

	@Override
	protected void initGoals() {
		this.goalSelector.add(0, new EscapeDangerGoal(this, 1.6));
		this.goalSelector.add(1, new FlyGoal(this, 1.0));
		this.goalSelector.add(2, new LookAroundGoal(this));
	}

	@Override
	public boolean isPushable() {
		return false;
	}

	@Override
	protected void fall(double heightDifference, boolean onGround, net.minecraft.block.BlockState state, net.minecraft.util.math.BlockPos landedPosition) {
	}
}
