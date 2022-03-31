"use strict";
/* Mersenne Twister 移植
 * Leonardone @ NEETSDKASU
 * BSD-2-Clause License
 */
class MersenneTwister {
    constructor(seed) {
        /* the array for the state vector  */
        this.mt = new Uint32Array(MersenneTwister.N);
        this.val = new Uint32Array(1);
        /* mti==N+1 means mt[N] is not initialized */
        this.mti = MersenneTwister.N + 1;
        this.setSeed(seed ?? 5489);
    }
    static mul(x, y) {
        return ((x & 0xffff) * y + ((((x >>> 16) & 0xffff) * y) << 16)) & 0xffffffff;
    }
    setSeed(seed) {
        if (typeof seed === 'number') {
            this.init_genrand(seed);
        }
        else {
            this.init_by_array(seed);
        }
    }
    /* initializes mt[N] with a seed */
    init_genrand(seed) {
        const N = MersenneTwister.N;
        const mul = MersenneTwister.mul;
        const mt = this.mt;
        mt[0] = seed;
        for (let i = 1; i < N; i++) {
            mt[i] = mul(mt[i - 1] ^ (mt[i - 1] >>> 30), 1812433253);
            mt[i] += i;
        }
        this.mti = N;
    }
    /* initialize by an array */
    init_by_array(seed) {
        const N = MersenneTwister.N;
        const mul = MersenneTwister.mul;
        const mt = this.mt;
        this.init_genrand(19650218);
        let i = 1;
        let j = 0;
        let k = Math.max(N, seed.length);
        for (; k > 0; k--) {
            mt[i] ^= mul(mt[i - 1] ^ (mt[i - 1] >>> 30), 1664525);
            mt[i] += seed[j];
            mt[i] += j;
            i++;
            if (i >= N) {
                mt[0] = mt[N - 1];
                i = 1;
            }
            j++;
            if (j >= seed.length) {
                j = 0;
            }
        }
        for (k = N - 1; k; k--) {
            mt[i] ^= mul(mt[i - 1] ^ (mt[i - 1] >>> 30), 1566083941);
            mt[i] -= i;
            i++;
            if (i >= N) {
                mt[0] = mt[N - 1];
                i = 1;
            }
        }
        mt[0] = 0x80000000;
    }
    /* generates a random number on [0,0xffffffff]-interval */
    genrand_int32() {
        const mt = this.mt;
        let y;
        if (this.mti >= MersenneTwister.N) {
            const UPPER_MASK = 0x80000000;
            const LOWER_MASK = 0x7fffffff;
            const N = MersenneTwister.N;
            const M = 397;
            const mag01 = MersenneTwister.mag01;
            let kk = 0;
            for (; kk < N - M; kk++) {
                y = (mt[kk] & UPPER_MASK) | (mt[kk + 1] & LOWER_MASK);
                mt[kk] = mt[kk + M] ^ (y >>> 1) ^ mag01[y & 0x1];
            }
            for (; kk < N - 1; kk++) {
                y = (mt[kk] & UPPER_MASK) | (mt[kk + 1] & LOWER_MASK);
                mt[kk] = mt[kk + (M - N)] ^ (y >>> 1) ^ mag01[y & 0x1];
            }
            y = (mt[N - 1] & UPPER_MASK) | (mt[0] & LOWER_MASK);
            mt[N - 1] = mt[M - 1] ^ (y >>> 1) ^ mag01[y & 0x1];
            this.mti = 0;
        }
        y = mt[this.mti++];
        /* Tempering */
        y ^= (y >>> 11);
        y ^= (y << 7) & 0x9d2c5680;
        y ^= (y << 15) & 0xefc60000;
        y ^= (y >>> 18);
        this.val[0] = y;
        return this.val[0];
    }
    /* generates a random number on [0,0x7fffffff]-interval */
    genrand_int31() {
        return (this.genrand_int32() >>> 1);
    }
    /* generates a random number on [0,1]-real-interval */
    genrand_real1() {
        return this.genrand_int32() * (1.0 / 4294967295.0);
        /* divided by 2^32-1 */
    }
    /* generates a random number on [0,1)-real-interval */
    genrand_real2() {
        return this.genrand_int32() * (1.0 / 4294967296.0);
        /* divided by 2^32 */
    }
    /* generates a random number on (0,1)-real-interval */
    genrand_real3() {
        return (this.genrand_int32() + 0.5) * (1.0 / 4294967296.0);
        /* divided by 2^32 */
    }
    /* generates a random number on [0,1) with 53-bit resolution*/
    genrand_res53() {
        const a = this.genrand_int32() >>> 5;
        const b = this.genrand_int32() >>> 6;
        return (a * 67108864.0 + b) * (1.0 / 9007199254740992.0);
    }
}
MersenneTwister.N = 624;
MersenneTwister.mag01 = new Uint32Array([0, 0x9908b0df]);
/*
 *  疑似乱数生成機(RNG)  移植(Porting)
 *  Information of Original Source
 *  Mersenne Twister with improved initialization (2002)
 *  http://www.math.sci.hiroshima-u.ac.jp/~m-mat/MT/mt.html
 *  http://www.math.sci.hiroshima-u.ac.jp/~m-mat/MT/MT2002/mt19937ar.html
 */
// = 移植元ラインセンス (License of Original Source) =======================================================
// ======================================================================
/*
   A C-program for MT19937, with initialization improved 2002/1/26.
   Coded by Takuji Nishimura and Makoto Matsumoto.

   Before using, initialize the state by using init_genrand(seed)
   or init_by_array(init_key, key_length).

   Copyright (C) 1997 - 2002, Makoto Matsumoto and Takuji Nishimura,
   All rights reserved.

   Redistribution and use in source and binary forms, with or without
   modification, are permitted provided that the following conditions
   are met:

     1. Redistributions of source code must retain the above copyright
        notice, this list of conditions and the following disclaimer.

     2. Redistributions in binary form must reproduce the above copyright
        notice, this list of conditions and the following disclaimer in the
        documentation and/or other materials provided with the distribution.

     3. The names of its contributors may not be used to endorse or promote
        products derived from this software without specific prior written
        permission.

   THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
   "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
   LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
   A PARTICULAR PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT OWNER OR
   CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
   EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
   PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
   PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
   LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
   NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
   SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


   Any feedback is very welcome.
   http://www.math.sci.hiroshima-u.ac.jp/~m-mat/MT/emt.html
   email: m-mat @ math.sci.hiroshima-u.ac.jp (remove space)
*/
// ======================================================================
