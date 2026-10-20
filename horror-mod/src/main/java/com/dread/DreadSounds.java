package com.dread;

import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.sound.SoundEvent;

public final class DreadSounds {
	public static final SoundEvent SCREAM = reg("scream");
	public static final SoundEvent STING = reg("sting");
	public static final SoundEvent WHISPER = reg("whisper");
	public static final SoundEvent FOOTSTEPS = reg("footsteps");
	public static final SoundEvent KNOCK = reg("knock");
	public static final SoundEvent BREATH = reg("breath");
	public static final SoundEvent HEARTBEAT = reg("heartbeat");
	public static final SoundEvent DRONE = reg("drone");
	public static final SoundEvent STATIC = reg("static");
	public static final SoundEvent CREAK = reg("creak");
	public static final SoundEvent SWELL = reg("swell");
	public static final SoundEvent VOICE = reg("voice");
	public static final SoundEvent CHANT = reg("chant");
	public static final SoundEvent GROWL = reg("growl");
	public static final SoundEvent EERIE = reg("eerie");
	public static final SoundEvent SLAM = reg("slam");

	private static SoundEvent reg(String name) {
		var id = DreadMod.id(name);
		return Registry.register(Registries.SOUND_EVENT, id, SoundEvent.of(id));
	}

	public static void init() {
	}
}
