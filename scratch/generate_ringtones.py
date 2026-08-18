import wave
import struct
import math
import os

def write_wav(filename, samples, sample_rate=44100):
    max_val = max(abs(s) for s in samples) or 1.0
    normalized = [s / max_val * 0.92 for s in samples]
    with wave.open(filename, 'wb') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        packed = bytearray()
        for s in normalized:
            int_val = int(s * 32767.0)
            packed.extend(struct.pack('<h', int_val))
        wav_file.writeframes(packed)
    print(f"Generated {filename} successfully!")

def gen_chimes(filename="assets/spiritual_chimes.wav"):
    sr = 44100
    duration = 6.0
    total = int(sr * duration)
    samples = [0.0] * total
    notes = [
        (0.0, 523.25, 1.8), (0.6, 659.25, 1.8), (1.2, 783.99, 1.8), (1.8, 1046.50, 2.5),
        (2.8, 880.00, 1.8), (3.4, 783.99, 1.8), (4.0, 659.25, 2.2), (4.8, 523.25, 3.0),
    ]
    for start, freq, d in notes:
        st_idx = int(start * sr)
        ln = int(d * sr)
        for i in range(ln):
            idx = st_idx + i
            if idx >= total: break
            t = i / sr
            env = math.exp(-3.2 * (t / d)) * min(1.0, t * 80.0)
            h1 = math.sin(2.0 * math.pi * freq * t)
            h2 = 0.5 * math.sin(2.0 * math.pi * (freq * 2.0) * t) * math.exp(-4.5 * t)
            h3 = 0.25 * math.sin(2.0 * math.pi * (freq * 3.0) * t) * math.exp(-6.0 * t)
            samples[idx] += (h1 + h2 + h3) * env * 0.4
    write_wav(filename, samples, sr)

def gen_harp(filename="assets/morning_harp.wav"):
    sr = 44100
    duration = 6.0
    total = int(sr * duration)
    samples = [0.0] * total
    # G Major arpeggio G4, B4, D5, G5, B5, G5, D5, B4, G4
    notes = [
        (0.0, 392.00, 2.0), (0.4, 493.88, 2.0), (0.8, 587.33, 2.0), (1.2, 783.99, 2.2),
        (1.6, 987.77, 2.5), (2.4, 783.99, 2.0), (2.8, 587.33, 2.0), (3.2, 493.88, 2.0),
        (3.8, 392.00, 3.0)
    ]
    for start, freq, d in notes:
        st_idx = int(start * sr)
        ln = int(d * sr)
        for i in range(ln):
            idx = st_idx + i
            if idx >= total: break
            t = i / sr
            # Plucked string envelope
            env = math.exp(-4.0 * (t / d)) * min(1.0, t * 150.0)
            h1 = math.sin(2.0 * math.pi * freq * t)
            h2 = 0.6 * math.sin(2.0 * math.pi * (freq * 2.0) * t) * math.exp(-3.0 * t)
            h3 = 0.3 * math.sin(2.0 * math.pi * (freq * 3.0) * t) * math.exp(-5.0 * t)
            samples[idx] += (h1 + h2 + h3) * env * 0.45
    write_wav(filename, samples, sr)

def gen_piano(filename="assets/peaceful_piano.wav"):
    sr = 44100
    duration = 6.0
    total = int(sr * duration)
    samples = [0.0] * total
    # Soft contemplative F major hymn F4, A4, C5, F5, E5, D5, C5, A4, F4
    notes = [
        (0.0, 349.23, 2.5), (0.5, 440.00, 2.5), (1.0, 523.25, 2.5), (1.6, 698.46, 2.8),
        (2.6, 659.25, 2.0), (3.2, 587.33, 2.0), (3.8, 523.25, 2.2), (4.5, 349.23, 3.5)
    ]
    for start, freq, d in notes:
        st_idx = int(start * sr)
        ln = int(d * sr)
        for i in range(ln):
            idx = st_idx + i
            if idx >= total: break
            t = i / sr
            env = math.exp(-2.5 * (t / d)) * min(1.0, t * 100.0)
            h1 = math.sin(2.0 * math.pi * freq * t)
            h2 = 0.4 * math.sin(2.0 * math.pi * (freq * 2.0) * t) * math.exp(-3.5 * t)
            h3 = 0.15 * math.sin(2.0 * math.pi * (freq * 3.0) * t) * math.exp(-5.0 * t)
            samples[idx] += (h1 + h2 + h3) * env * 0.4
    write_wav(filename, samples, sr)

def gen_fanfare(filename="assets/gospel_fanfare.wav"):
    sr = 44100
    duration = 5.5
    total = int(sr * duration)
    samples = [0.0] * total
    # Joyful brass fanfare C4, G4, C5, E5, G5, C6
    notes = [
        (0.0, 261.63, 0.4), (0.4, 392.00, 0.4), (0.8, 523.25, 0.5), (1.3, 659.25, 0.6),
        (2.0, 783.99, 1.2), (3.2, 1046.50, 2.5)
    ]
    for start, freq, d in notes:
        st_idx = int(start * sr)
        ln = int(d * sr)
        for i in range(ln):
            idx = st_idx + i
            if idx >= total: break
            t = i / sr
            # Brass envelope with rich harmonics
            env = math.exp(-1.8 * (t / d)) * min(1.0, t * 50.0)
            h1 = math.sin(2.0 * math.pi * freq * t)
            h2 = 0.7 * math.sin(2.0 * math.pi * (freq * 2.0) * t)
            h3 = 0.5 * math.sin(2.0 * math.pi * (freq * 3.0) * t)
            h4 = 0.3 * math.sin(2.0 * math.pi * (freq * 4.0) * t)
            samples[idx] += (h1 + h2 + h3 + h4) * env * 0.3
    write_wav(filename, samples, sr)

def gen_cathedral(filename="assets/cathedral_bells.wav"):
    sr = 44100
    duration = 6.5
    total = int(sr * duration)
    samples = [0.0] * total
    # Deep cathedral bells E3, G#3, B3, E4
    notes = [
        (0.0, 164.81, 4.0), (1.5, 207.65, 4.0), (3.0, 246.94, 4.0), (4.5, 329.63, 4.5)
    ]
    for start, freq, d in notes:
        st_idx = int(start * sr)
        ln = int(d * sr)
        for i in range(ln):
            idx = st_idx + i
            if idx >= total: break
            t = i / sr
            env = math.exp(-1.6 * (t / d)) * min(1.0, t * 60.0)
            h1 = math.sin(2.0 * math.pi * freq * t)
            h2 = 0.6 * math.sin(2.0 * math.pi * (freq * 2.0) * t) * math.exp(-2.0 * t)
            h3 = 0.4 * math.sin(2.0 * math.pi * (freq * 2.76) * t) * math.exp(-2.5 * t) # bell strike
            h4 = 0.25 * math.sin(2.0 * math.pi * (freq * 4.0) * t) * math.exp(-3.0 * t)
            samples[idx] += (h1 + h2 + h3 + h4) * env * 0.4
    write_wav(filename, samples, sr)

if __name__ == "__main__":
    os.makedirs("assets", exist_ok=True)
    gen_chimes("assets/spiritual_chimes.wav")
    gen_harp("assets/morning_harp.wav")
    gen_piano("assets/peaceful_piano.wav")
    gen_fanfare("assets/gospel_fanfare.wav")
    gen_cathedral("assets/cathedral_bells.wav")
