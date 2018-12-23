const data = require('./input.json')
    .map(v => {
        let match = v.match(/pos=<(-?\d+),(-?\d+),(-?\d+)>, r=(-?\d+)/);
        return {
            x: parseInt(match[1], 10),
            y: parseInt(match[2], 10),
            z: parseInt(match[3], 10),
            r: parseInt(match[4], 10),
        };
    });

let strongest = null, max = -Infinity;
let minx = Infinity, maxx = -Infinity,
    miny = Infinity, maxy = -Infinity,
    minz = Infinity, maxz = -Infinity;

data.forEach(nb => {
    minx = Math.min(nb.x, minx);
    maxx = Math.max(nb.x, maxx);
    miny = Math.min(nb.x, miny);
    maxy = Math.max(nb.x, maxy);
    minz = Math.min(nb.x, minz);
    maxz = Math.max(nb.x, maxz);

    if (nb.r > max) {
        max = nb.r;
        strongest = nb;
    }
});

const mhd = (a, b) =>
    Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.z - b.z);

let a = data.filter(v => mhd(v, strongest) <= strongest.r);
console.log('part 1:', a.length);

const inRangeOfVolume = (vol, bot) => {
    let cost = 0;
    if (bot.x > vol.xmax) {
        cost += bot.x - vol.xmax;
    } else if (bot.x < vol.xmin) {
        cost += vol.xmin - bot.x;
    }

    if (bot.y > vol.ymax) {
        cost += bot.y - vol.ymax;
    } else if (bot.y < vol.ymin) {
        cost += vol.ymin - bot.y;
    }

    if (bot.z > vol.zmax) {
        cost += bot.z - vol.zmax;
    } else if (bot.z < vol.zmin) {
        cost += vol.zmin - bot.z;
    }

    return cost <= bot.r;
};

const nearestPoint = (vol, bot) => {
    let nx = (bot.x > vol.xmax ? vol.xmax : bot.x < vol.xmin ? vol.xmin : bot.x),
        ny = (bot.y > vol.ymax ? vol.ymax : bot.y < vol.ymin ? vol.ymin : bot.y),
        nz = (bot.z > vol.zmax ? vol.zmax : bot.z < vol.zmin ? vol.zmin : bot.z);
    return {x: nx, y: ny, z: nz};
};

const botsInRange = (vol) => {
    let set = new Set();
    for (let nb of data) {
        if (inRangeOfVolume(vol, nb)) { set.add(nb); }
    }
    return set;
};

let vol = {
    xmin: Math.min(minx, miny, minz),
    xmax: Math.max(maxx, maxy, maxz),
    ymin: Math.min(minx, miny, minz),
    ymax: Math.max(maxx, maxy, maxz),
    zmin: Math.min(minx, miny, minz),
    zmax: Math.max(maxx, maxy, maxz),
};

const subdivide = vol => {
    if (vol.xmin === vol.xmax && vol.ymin === vol.ymax && vol.zmin === vol.zmax) {
        return {xmin: vol.xmin, xmax: vol.xmax, ymin: vol.ymin, ymax: vol.ymax, zmin: vol.zmin, zmax: vol.zmax};
    }

    let xmid = Math.floor((vol.xmax - vol.xmin) / 2 + vol.xmin),
        ymid = Math.floor((vol.ymax - vol.ymin) / 2 + vol.ymin),
        zmid = Math.floor((vol.zmax - vol.zmin) / 2 + vol.zmin);

    // sometimes this function will get called with a volume that's a line, or a plane
    // this will generate duplicate volumes, but they don't matter significantly
    return [
        { xmin: vol.xmin, xmax: xmid,     ymin: vol.ymin, ymax: ymid,     zmin: vol.zmin, zmax: zmid     },
        { xmin: xmid + 1, xmax: vol.xmax, ymin: vol.ymin, ymax: ymid,     zmin: vol.zmin, zmax: zmid     },
        { xmin: vol.xmin, xmax: xmid,     ymin: ymid + 1, ymax: vol.ymax, zmin: vol.zmin, zmax: zmid     },
        { xmin: xmid + 1, xmax: vol.xmax, ymin: ymid + 1, ymax: vol.ymax, zmin: vol.zmin, zmax: zmid     },
        { xmin: vol.xmin, xmax: xmid,     ymin: vol.ymin, ymax: ymid,     zmin: zmid + 1, zmax: vol.zmax },
        { xmin: xmid + 1, xmax: vol.xmax, ymin: vol.ymin, ymax: ymid,     zmin: zmid + 1, zmax: vol.zmax },
        { xmin: vol.xmin, xmax: xmid,     ymin: ymid + 1, ymax: vol.ymax, zmin: zmid + 1, zmax: vol.zmax },
        { xmin: xmid + 1, xmax: vol.xmax, ymin: ymid + 1, ymax: vol.ymax, zmin: zmid + 1, zmax: vol.zmax },
    ];
};

let origin = {x: 0, y: 0, z: 0};

let vols = [ vol ];
vol.inRange = botsInRange(vol);

let best = null, bestP = null, bestD = Infinity;

const findBest = (v1, v2) =>
    v1.inRange.size > v2.inRange.size ? v1 :
    v2.inRange.size > v1.inRange.size ? v2 :
    nearestPoint(v1, origin) < nearestPoint(v2, origin) ? v1 :
    nearestPoint(v2, origin) < nearestPoint(v1, origin) ? v2 :
    v1; // arbitrary

outer: while (vols.length) {
    let v;
    while (vols.length) {
        v = vols.pop();

        // we haven't refined this volume to a single point, subdivide it more
        if (
            v.xmax - v.xmin > 0 ||
            v.ymax - v.ymin > 0 ||
            v.zmax - v.zmin > 0
        ) { break; }

        // we have a single point; is it better than our current best?
        best = best ? findBest(best, v) : v;
        bestP = nearestPoint(best, origin);
        bestD = mhd(bestP, origin);

        // if we have a new best, we can discard all candidates whose
        // upper bound of bot count is lower than the new best
        if (best === v) {
            vols = vols.filter(v2 =>
                v2.inRange.size >= best.inRange.size &&
                mhd(nearestPoint(v2, origin), origin) <= bestD
            );
        }

        // pop a new candidate volume, or end our loop
        continue outer;
    }

    let newVols = [ ];

    // split a volume into 8 sub-volumes and annotate with bot counts
    subdivide(v).forEach(v => {
        v.inRange = botsInRange(v);
        // nothing can reach this volume, discard it
        if (v.inRange.size === 0) { return; }
        // this volume's best case count of bots that can reach it is worse than our current best, discard it
        if (best && v.inRange.size < best.inRange.size) { return; }
        // this volume's closest point to the origin is worse than our current best, discard it
        if (best && mhd(nearestPoint(v, origin), origin) > bestD) { return; }
        newVols.push(v);
    });

    // add the new volumes to the queue
    Array.prototype.push.apply(vols, newVols);

    // sort the queue so that the volumes with the most bots that can reach them are
    // at the end; this ensures that each iteration we work with the most promising volume
    vols.sort((a, b) => a.inRange.size - b.inRange.size);
}

console.log(best.inRange.size, bestD);