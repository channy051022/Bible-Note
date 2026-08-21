import wave
import struct
import math
import os
import shutil

def write_wav(filename, samples, sample_rate=44100):
    # Apply soft clipping / limiter and peak normalize to 0.98
    compressed = []
    for s in samples:
        # Soft tanh-like compression to boost perceived loudness (RMS)
        val = math.tanh(s * 1.5)
        compressed.append(val)
    
    max_val = max(abs(s) for s in compressed) or 1.0
    normalized = [s / max_val * 0.98 for s in compressed]
    
    with wave.open(filename, 'wb') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        packed = bytearray()
        for s in normalized:
            int_val = int(s * 32767.0)
            int_val = max(-32767, min(32767, int_val))
            packed.extend(struct.pack('<h', int_val))
        wav_file.writeframes(packed)
    print(f"Generated {filename} (Duration: {len(samples)/sample_rate:.1f}s, Samples: {len(samples)})")

def gen_chimes(filename="assets/spiritual_chimes.wav", duration=28.0):
    sr = 44100
    total = int(sr * duration)
    samples = [0.0] * total
    
    # 5-second motif looped across 28 seconds
    motif = [
        (0.0, 523.25, 1.6),   # C5
        (0.5, 659.25, 1.6),   # E5
        (1.0, 783.99, 1.6),   # G5
        (1.5, 1046.50, 2.2),  # C6
        (2.4, 880.00, 1.6),   # A5
        (2.9, 783.99, 1.6),   # G5
        (3.4, 659.25, 1.8),   # E5
        (4.0, 523.25, 2.5),   # C5
    ]
    loop_len = 5.2
    num_loops = int(duration / loop_len) + 2
    
    for loop in range(num_loops):
        base_time = loop * loop_len
        for start, freq, d in motif:
            t_start = base_time + start
            st_idx = int(t_start * sr)
            ln = int(d * sr)
            for i in range(ln):
                idx = st_idx + i
                if idx >= total: break
                t = i / sr
                env = math.exp(-2.2 * (t / d)) * min(1.0, t * 120.0)
                h1 = math.sin(2.0 * math.pi * freq * t)
                h2 = 0.5 * math.sin(2.0 * math.pi * (freq * 2.0) * t) * math.exp(-3.0 * t)
                h3 = 0.3 * math.sin(2.0 * math.pi * (freq * 3.0) * t) * math.exp(-4.5 * t)
                h4 = 0.15 * math.sin(2.0 * math.pi * (freq * 4.0) * t) * math.exp(-6.0 * t)
                samples[idx] += (h1 + h2 + h3 + h4) * env * 0.7
                
    write_wav(filename, samples, sr)

def gen_sunrise(filename="assets/radiant_sunrise_bell.wav", duration=28.0):
    sr = 44100
    total = int(sr * duration)
    samples = [0.0] * total
    
    # Radiant sunrise bells motif (D Major: D5, F#5, A5, D6, C#6, B5, A5, D5)
    motif = [
        (0.0, 587.33, 1.8),
        (0.6, 739.99, 1.8),
        (1.2, 880.00, 2.0),
        (1.8, 1174.66, 2.5),
        (2.8, 1108.73, 1.8),
        (3.4, 987.77, 1.8),
        (4.0, 880.00, 2.0),
        (4.8, 587.33, 2.8),
    ]
    loop_len = 6.0
    num_loops = int(duration / loop_len) + 2
    
    for loop in range(num_loops):
        base_time = loop * loop_len
        for start, freq, d in motif:
            t_start = base_time + start
            st_idx = int(t_start * sr)
            ln = int(d * sr)
            for i in range(ln):
                idx = st_idx + i
                if idx >= total: break
                t = i / sr
                env = math.exp(-2.0 * (t / d)) * min(1.0, t * 140.0)
                h1 = math.sin(2.0 * math.pi * freq * t)
                h2 = 0.6 * math.sin(2.0 * math.pi * (freq * 2.0) * t) * math.exp(-2.5 * t)
                h3 = 0.35 * math.sin(2.0 * math.pi * (freq * 2.76) * t) * math.exp(-3.0 * t)
                h4 = 0.2 * math.sin(2.0 * math.pi * (freq * 4.0) * t) * math.exp(-4.5 * t)
                samples[idx] += (h1 + h2 + h3 + h4) * env * 0.75
                
    write_wav(filename, samples, sr)

def gen_fanfare(filename="assets/gospel_fanfare.wav", duration=28.0):
    sr = 44100
    total = int(sr * duration)
    samples = [0.0] * total
    
    # Joyful gospel brass fanfare
    motif = [
        (0.0, 261.63, 0.45), # C4
        (0.4, 392.00, 0.45), # G4
        (0.8, 523.25, 0.55), # C5
        (1.3, 659.25, 0.7),  # E5
        (2.0, 783.99, 1.4),  # G5
        (3.2, 1046.50, 2.5), # C6
    ]
    loop_len = 5.5
    num_loops = int(duration / loop_len) + 2
    
    for loop in range(num_loops):
        base_time = loop * loop_len
        for start, freq, d in motif:
            t_start = base_time + start
            st_idx = int(t_start * sr)
            ln = int(d * sr)
            for i in range(ln):
                idx = st_idx + i
                if idx >= total: break
                t = i / sr
                env = math.exp(-1.4 * (t / d)) * min(1.0, t * 70.0)
                h1 = math.sin(2.0 * math.pi * freq * t)
                h2 = 0.75 * math.sin(2.0 * math.pi * (freq * 2.0) * t)
                h3 = 0.55 * math.sin(2.0 * math.pi * (freq * 3.0) * t)
                h4 = 0.35 * math.sin(2.0 * math.pi * (freq * 4.0) * t)
                samples[idx] += (h1 + h2 + h3 + h4) * env * 0.65
                
    write_wav(filename, samples, sr)

def gen_cathedral(filename="assets/cathedral_bells.wav", duration=28.0):
    sr = 44100
    total = int(sr * duration)
    samples = [0.0] * total
    
    motif = [
        (0.0, 220.00, 3.5), # A3
        (1.5, 277.18, 3.5), # C#4
        (3.0, 329.63, 3.5), # E4
        (4.5, 440.00, 4.0), # A4
    ]
    loop_len = 6.0
    num_loops = int(duration / loop_len) + 2
    
    for loop in range(num_loops):
        base_time = loop * loop_len
        for start, freq, d in motif:
            t_start = base_time + start
            st_idx = int(t_start * sr)
            ln = int(d * sr)
            for i in range(ln):
                idx = st_idx + i
                if idx >= total: break
                t = i / sr
                env = math.exp(-1.3 * (t / d)) * min(1.0, t * 80.0)
                h1 = math.sin(2.0 * math.pi * freq * t)
                h2 = 0.65 * math.sin(2.0 * math.pi * (freq * 2.0) * t) * math.exp(-1.5 * t)
                h3 = 0.45 * math.sin(2.0 * math.pi * (freq * 2.76) * t) * math.exp(-2.0 * t)
                h4 = 0.3 * math.sin(2.0 * math.pi * (freq * 4.0) * t) * math.exp(-2.5 * t)
                samples[idx] += (h1 + h2 + h3 + h4) * env * 0.7
                
    write_wav(filename, samples, sr)

def gen_harp(filename="assets/morning_harp.wav", duration=28.0):
    sr = 44100
    total = int(sr * duration)
    samples = [0.0] * total
    
    motif = [
        (0.0, 392.00, 1.8), # G4
        (0.4, 493.88, 1.8), # B4
        (0.8, 587.33, 1.8), # D5
        (1.2, 783.99, 2.0), # G5
        (1.6, 987.77, 2.2), # B5
        (2.4, 783.99, 1.8),
        (2.8, 587.33, 1.8),
        (3.2, 493.88, 1.8),
        (3.8, 392.00, 2.5),
    ]
    loop_len = 5.5
    num_loops = int(duration / loop_len) + 2
    
    for loop in range(num_loops):
        base_time = loop * loop_len
        for start, freq, d in motif:
            t_start = base_time + start
            st_idx = int(t_start * sr)
            ln = int(d * sr)
            for i in range(ln):
                idx = st_idx + i
                if idx >= total: break
                t = i / sr
                env = math.exp(-2.5 * (t / d)) * min(1.0, t * 180.0)
                h1 = math.sin(2.0 * math.pi * freq * t)
                h2 = 0.65 * math.sin(2.0 * math.pi * (freq * 2.0) * t) * math.exp(-2.0 * t)
                h3 = 0.35 * math.sin(2.0 * math.pi * (freq * 3.0) * t) * math.exp(-3.5 * t)
                samples[idx] += (h1 + h2 + h3) * env * 0.75
                
    write_wav(filename, samples, sr)

def gen_piano(filename="assets/peaceful_piano.wav", duration=28.0):
    sr = 44100
    total = int(sr * duration)
    samples = [0.0] * total
    
    motif = [
        (0.0, 349.23, 2.2), # F4
        (0.5, 440.00, 2.2), # A4
        (1.0, 523.25, 2.2), # C5
        (1.6, 698.46, 2.5), # F5
        (2.6, 659.25, 1.8), # E5
        (3.2, 587.33, 1.8), # D5
        (3.8, 523.25, 2.0), # C5
        (4.5, 349.23, 2.8), # F4
    ]
    loop_len = 5.8
    num_loops = int(duration / loop_len) + 2
    
    for loop in range(num_loops):
        base_time = loop * loop_len
        for start, freq, d in motif:
            t_start = base_time + start
            st_idx = int(t_start * sr)
            ln = int(d * sr)
            for i in range(ln):
                idx = st_idx + i
                if idx >= total: break
                t = i / sr
                env = math.exp(-1.8 * (t / d)) * min(1.0, t * 120.0)
                h1 = math.sin(2.0 * math.pi * freq * t)
                h2 = 0.5 * math.sin(2.0 * math.pi * (freq * 2.0) * t) * math.exp(-2.5 * t)
                h3 = 0.25 * math.sin(2.0 * math.pi * (freq * 3.0) * t) * math.exp(-3.5 * t)
                samples[idx] += (h1 + h2 + h3) * env * 0.7
                
def gen_classic_bell(filename="assets/classic_phone_bell.wav", duration=28.0):
    sr = 44100
    total = int(sr * duration)
    samples = [0.0] * total
    
    # Classic telephone dual bell: 440 Hz & 480 Hz modulated with 20 Hz clapper striking
    cycle_len = 3.5  # 1.8s ring, 1.7s pause
    num_cycles = int(duration / cycle_len) + 2
    
    for cycle in range(num_cycles):
        base_t = cycle * cycle_len
        ring_duration = 1.8
        st_idx = int(base_t * sr)
        ln = int(ring_duration * sr)
        
        for i in range(ln):
            idx = st_idx + i
            if idx >= total: break
            t = i / sr
            # 20 Hz bell clapper amplitude modulation
            clapper = 0.5 + 0.5 * math.sin(2.0 * math.pi * 20.0 * t)
            # Dual frequency metallic telephone bell resonance
            s1 = math.sin(2.0 * math.pi * 440.0 * t)
            s2 = math.sin(2.0 * math.pi * 480.0 * t)
            s3 = 0.3 * math.sin(2.0 * math.pi * 880.0 * t)
            s4 = 0.2 * math.sin(2.0 * math.pi * 1200.0 * t)
            
            # Attack and release of each ring burst
            burst_env = min(1.0, t * 20.0) * min(1.0, (ring_duration - t) * 15.0)
            samples[idx] += (s1 + s2 + s3 + s4) * clapper * burst_env * 0.75

    write_wav(filename, samples, sr)

def gen_digital_alarm(filename="assets/digital_alarm_beeps.wav", duration=28.0):
    sr = 44100
    total = int(sr * duration)
    samples = [0.0] * total
    
    # Classic Digital Clock Beep-Beep-Beep-Beep alarm
    # 4 beeps in 0.8s, then 0.7s pause = 1.5s cycle
    cycle_len = 1.5
    num_cycles = int(duration / cycle_len) + 2
    beep_len = 0.10
    beep_interval = 0.18
    freq = 2048.0 # Crisp digital piezo buzzer frequency
    
    for cycle in range(num_cycles):
        base_t = cycle * cycle_len
        for b in range(4):
            b_start = base_t + b * beep_interval
            st_idx = int(b_start * sr)
            ln = int(beep_len * sr)
            for i in range(ln):
                idx = st_idx + i
                if idx >= total: break
                t = i / sr
                env = min(1.0, t * 200.0) * min(1.0, (beep_len - t) * 200.0)
                # Piezo square/sine harmonic combination
                tone = math.sin(2.0 * math.pi * freq * t) + 0.3 * math.sin(2.0 * math.pi * (freq * 2.0) * t)
                samples[idx] += tone * env * 0.85

    write_wav(filename, samples, sr)

def gen_marimba(filename="assets/modern_marimba.wav", duration=28.0):
    sr = 44100
    total = int(sr * duration)
    samples = [0.0] * total
    
    # Modern Smartphone Marimba Melody
    # Upbeat rising arpeggio pattern
    motif = [
        (0.0, 587.33, 0.45),  # D5
        (0.18, 659.25, 0.45), # E5
        (0.36, 783.99, 0.45), # G5
        (0.54, 880.00, 0.45), # A5
        (0.72, 1046.50, 0.65),# C6
        (1.08, 880.00, 0.45), # A5
        (1.26, 1046.50, 0.45),# C6
        (1.44, 1174.66, 0.8), # D6
        
        (2.16, 1046.50, 0.45),# C6
        (2.34, 880.00, 0.45), # A5
        (2.52, 783.99, 0.45), # G5
        (2.70, 659.25, 0.45), # E5
        (2.88, 587.33, 0.9),  # D5
    ]
    loop_len = 4.2
    num_loops = int(duration / loop_len) + 2
    
    for loop in range(num_loops):
        base_t = loop * loop_len
        for start, freq, d in motif:
            t_start = base_t + start
            st_idx = int(t_start * sr)
            ln = int(d * sr)
            for i in range(ln):
                idx = st_idx + i
                if idx >= total: break
                t = i / sr
                # Wooden marimba percussive envelope
                env = math.exp(-6.0 * (t / d)) * min(1.0, t * 300.0)
                # Marimba body resonance
                m1 = math.sin(2.0 * math.pi * freq * t)
                m2 = 0.4 * math.sin(2.0 * math.pi * (freq * 3.0) * t) * math.exp(-12.0 * t)
                m3 = 0.2 * math.sin(2.0 * math.pi * (freq * 4.0) * t) * math.exp(-20.0 * t)
                samples[idx] += (m1 + m2 + m3) * env * 0.9

    write_wav(filename, samples, sr)

def gen_default_alarm(filename="assets/spiritual_alarm.wav", duration=28.0):
    # Generates loud, uplifting harmonic chime alarm
    gen_chimes(filename, duration)

if __name__ == "__main__":
    os.makedirs("assets", exist_ok=True)
    os.makedirs("android/app/src/main/res/raw", exist_ok=True)
    
    ringtones = [
        ("spiritual_chimes.wav", gen_chimes),
        ("radiant_sunrise_bell.wav", gen_sunrise),
        ("gospel_fanfare.wav", gen_fanfare),
        ("cathedral_bells.wav", gen_cathedral),
        ("morning_harp.wav", gen_harp),
        ("peaceful_piano.wav", gen_piano),
        ("classic_phone_bell.wav", gen_classic_bell),
        ("digital_alarm_beeps.wav", gen_digital_alarm),
        ("modern_marimba.wav", gen_marimba),
        ("spiritual_alarm.wav", gen_default_alarm),
    ]
    
    for name, gen_fn in ringtones:
        asset_path = os.path.join("assets", name)
        gen_fn(asset_path, duration=28.0)
        raw_path = os.path.join("android/app/src/main/res/raw", name)
        shutil.copyfile(asset_path, raw_path)
        print(f"Copied {name} -> {raw_path}")

    print("\nAll 28-second high-volume ringtones generated successfully!")
