var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

function SpringSystem(nodes, edges) {
    this.numSprings = edges.length;
    this.numNodes = nodes.length;
    this.numAttractions = this.numNodes * (this.numNodes / 2) - (this.numNodes / 2);
    this.totalTime = 0;

    var buf = new ArrayBuffer(this.numSprings * 8);
    var nBuf = new ArrayBuffer(this.numNodes * 3 * 3 * 4 + this.numNodes * 2);
    var aBuf = new ArrayBuffer(this.numAttractions * 8);

    this.nodeIdIndexMap = new Map();
    this.edgeIdIndexMap = new Map();

    this.nxps = new Float32Array(nBuf, (0 * this.numNodes) * 4, this.numNodes);
    this.nxvs = new Float32Array(nBuf, (1 * this.numNodes) * 4, this.numNodes);
    this.nxts = new Float32Array(nBuf, (2 * this.numNodes) * 4, this.numNodes);

    this.nyps = new Float32Array(nBuf, (3 * this.numNodes) * 4, this.numNodes);
    this.nyvs = new Float32Array(nBuf, (4 * this.numNodes) * 4, this.numNodes);
    this.nyts = new Float32Array(nBuf, (5 * this.numNodes) * 4, this.numNodes);

    this.sIds1 = new Float32Array(buf, (0 * this.numSprings) * 4, this.numSprings);
    this.sIds2 = new Float32Array(buf, (1 * this.numSprings) * 4, this.numSprings);

    this.aIds1 = new Float32Array(aBuf, (0 * this.numAttractions) * 4, this.numAttractions);
    this.aIds2 = new Float32Array(aBuf, (1 * this.numAttractions) * 4, this.numAttractions);

    for (var i = 0; i < this.numNodes; ++i) {
        var attrIndex = 0;
        this.nxps[i] = this.nxps[i] = Math.random() * window.innerWidth;
        this.nyps[i] = this.nyts[i] = Math.random() * window.innerHeight;
        this.nodeIdIndexMap.set(nodes[i].id, i);
        for (var c = i + 1; c < this.numNodes; ++c) {
            this.aIds1[attrIndex] = i;
            this.aIds2[attrIndex] = c;
            attrIndex++;
        }
    }

    for (var i = 0; i < this.numSprings; ++i) {
        this.sIds1[i] = this.nodeIdIndexMap.get(edges[i].source);
        this.sIds2[i] = this.nodeIdIndexMap.get(edges[i].target);
        this.edgeIdIndexMap.set(edges[i].id || i, i);
    }
}

SpringSystem.prototype.updateSprings = function (xps, yps, xvs, yvs, ids1, ids2) {
    var numSprings = this.numSprings >>> 0;
    var stiffness = 10;
    var damping = 0.03;
    var restDistance = 150;

    for (var i = 0; i < numSprings; ++i) {
        var dx1 = xps[ids2[i]] - xps[ids1[i]];
        var dy1 = yps[ids2[i]] - yps[ids1[i]];
        var dvx1 = xvs[ids2[i]] - xvs[ids1[i]];
        var dvy1 = yvs[ids2[i]] - yvs[ids1[i]];
        var len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
        len1 = len1 || 1;

        var nx1 = dx1 / len1;
        var ny1 = dy1 / len1;

        var dx2 = xps[ids1[i]] - xps[ids2[i]];
        var dy2 = yps[ids1[i]] - yps[ids2[i]];
        var dvx2 = xvs[ids1[i]] - xvs[ids2[i]];
        var dvy2 = yvs[ids1[i]] - yvs[ids2[i]];
        var len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
        len2 = len2 || 1;

        var nx2 = dx2 / len2;
        var ny2 = dy2 / len2;

        var fx1 = stiffness * (len1 - restDistance) * (nx1 / len1) - damping * dvx1;
        var fy1 = stiffness * (len1 - restDistance) * (ny1 / len1) - damping * dvy1;

        var fx2 = stiffness * (len1 - restDistance) * (nx2 / len1) - damping * dvx2;
        var fy2 = stiffness * (len1 - restDistance) * (ny2 / len1) - damping * dvy2;

        xvs[ids1[i]] += fx1;
        yvs[ids1[i]] += fy1;

        xvs[ids2[i]] += fx2;
        xvs[ids2[i]] += fy2;
    }
}

SpringSystem.prototype.updateNodes = function (xps, yps, xvs, yvs) {
    var numNodes = this.numNodes >>> 0;

    for (var i = 0; i < numNodes; ++i) {
        xvs[i] = xvs[i] > 0.0001 ? xvs[i] : 0;
        yvs[i] = yvs[i] > 0.0001 ? yvs[i] : 0;

        xps[i] += xvs[i];
        yps[i] += yvs[i];
    }
}

SpringSystem.prototype.update = function () {
    this.updateSprings(this.nxps, this.nyps, this.nxvs, this.nyvs, this.sIds1, this.sIds2);
    this.updateNodes(this.nxps, this.nyps, this.nxvs, this.nyvs);
}

SpringSystem.prototype.render = function () {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    var numSprings = this.numSprings >>> 0;
    var numNodes = this.numNodes >>> 0;
    var endAngle = 2 * Math.PI;

    for (var i = 0; i < numSprings; ++i) {
        var x1 = this.nxps[this.sIds1[i]];
        var y1 = this.nyps[this.sIds1[i]];

        var x2 = this.nxps[this.sIds2[i]];
        var y2 = this.nyps[this.sIds2[i]];

        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "blue";
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }

    for (var i = 0; i < numNodes; ++i) {
        var x = this.nxps[i];
        var y = this.nyps[i];

        ctx.beginPath();
        ctx.arc(x, y, 20, 0, endAngle, false);
        ctx.fillStyle = "#252525";
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#252525";
        ctx.stroke();
    }

    ctx.restore();
}

function getScaleFreeNetwork(nodeCount) {
    /* eslint-enable */
    var nodes = []
    var edges = []
    var connectionCount = []

    // randomly create some nodes and edges
    for (var i = 0; i < nodeCount; i++) {
        nodes.push({
            id: i
        })

        connectionCount[i] = 0

        // create edges in a scale-free-network way
        if (i == 1) {
            let from = i
            let to = 0
            edges.push({
                source: from,
                target: to
            })
            connectionCount[from]++
            connectionCount[to]++
        } else if (i > 1) {
            var conn = edges.length * 2
            var rand = Math.floor(Math.random() * conn)
            var cum = 0
            var j = 0
            while (j < connectionCount.length && cum < rand) {
                cum += connectionCount[j]
                j++
            }

            var from = i
            var to = j
            edges.push({
                source: from,
                target: to
            })
            connectionCount[from]++
            connectionCount[to]++
        }
    }

    return {
        nodes: nodes,
        edges: edges
    }
}

var {
    nodes,
    edges
} = getScaleFreeNetwork(2000);

var simulation = new SpringSystem(nodes, edges);

function updateWorld() {
    console.time('update');
    simulation.update();
    console.timeEnd('update');

    console.time('render');
    simulation.render();
    console.timeEnd('render');

    requestAnimationFrame(() => {
        updateWorld();
    });
}

requestAnimationFrame(() => {
    updateWorld();
})