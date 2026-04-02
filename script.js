// This object stores the current filter choices
const state = {
  selectedMonth: 'All Months',
  selectedTier: 'All Tiers',
  selectedClub: 'All Clubs'
};

// This selects the tooltip box from the HTML
const tooltip = d3.select('#tooltip');

// These are the main colors used in the charts
const colors = {
  primary: '#2563eb',
  teal: '#14b8a6',
  amber: '#f59e0b',
  rose: '#ef4444',
  purple: '#8b5cf6'
};

// These help format numbers, money, and dates nicely
const numberFmt = d3.format(',');
const moneyFmt = d3.format('$,.0f');
const monthFmt = d3.timeFormat('%b %Y');
const parseMonth = d3.timeParse('%Y-%m');

// Load all 3 CSV files together before drawing anything
Promise.all([
  // Load movement data with club coordinates
  d3.csv('data/club_flows_with_coordinates.csv', d => ({
    flow_month: d.flow_month,
    origin_club: d.origin_club,
    destination_club: d.destination_club,
    flow_count: +d.flow_count,
    origin_lat: +d.origin_lat,
    origin_lon: +d.origin_lon,
    dest_lat: +d.dest_lat,
    dest_lon: +d.dest_lon
  })),

  // Load member data
  d3.csv('data/member_metrics.csv', d => ({
    member_id: d.member_id,
    membership_tier: d.membership_tier,
    home_club: d.home_club,
    age: +d.age,
    monthly_fee: +d.monthly_fee,
    total_checkins: +d.total_checkins,
    avg_app_login_minutes: +d.avg_app_login_minutes,
    unique_clubs: +d.unique_clubs,
    total_sales: +d.total_sales
  })),

  // Load class trend data
  d3.csv('data/class_streamgraph.csv', d => {
    const row = {
      checkin_month: d.checkin_month,
      date: parseMonth(d.checkin_month)
    };

    // Turn all class values into numbers
    Object.keys(d).forEach(key => {
      if (key !== 'checkin_month') {
        row[key] = +d[key];
      }
    });

    return row;
  })
]).then(([flowsGeo, memberMetrics, streamData]) => {
  // Put all loaded data into one object
  const data = { flowsGeo, memberMetrics, streamData };

  // Build dropdown filters and draw all charts
  buildFilters(data);
  renderAll(data);

  // When the month filter changes, update dashboard
  d3.select('#monthFilter').on('change', function () {
    state.selectedMonth = this.value;
    renderAll(data);
  });

  // When membership tier changes, update dashboard
  d3.select('#tierFilter').on('change', function () {
    state.selectedTier = this.value;
    renderAll(data);
  });

  // When home club changes, update dashboard
  d3.select('#clubFilter').on('change', function () {
    state.selectedClub = this.value;
    renderAll(data);
  });

  // Reset button puts all filters back to default
  d3.select('#resetFilters').on('click', () => {
    state.selectedMonth = 'All Months';
    state.selectedTier = 'All Tiers';
    state.selectedClub = 'All Clubs';

    d3.select('#monthFilter').property('value', state.selectedMonth);
    d3.select('#tierFilter').property('value', state.selectedTier);
    d3.select('#clubFilter').property('value', state.selectedClub);

    renderAll(data);
  });
}).catch(error => {
  // If data does not load, show error in browser
  console.error(error);
  document.body.insertAdjacentHTML(
    'beforeend',
    '<p style="padding:24px;color:#b91c1c;">Data failed to load. Run the project with Live Server and check file names.</p>'
  );
});

// Create dropdown filter options from the data
function buildFilters(data) {
  const months = Array.from(new Set(data.flowsGeo.map(d => d.flow_month))).sort();
  const tiers = Array.from(new Set(data.memberMetrics.map(d => d.membership_tier))).sort();
  const clubs = Array.from(new Set(data.memberMetrics.map(d => d.home_club))).sort();

  populateSelect('#monthFilter', ['All Months', ...months], d =>
    d === 'All Months' ? d : monthFmt(parseMonth(d))
  );
  populateSelect('#tierFilter', ['All Tiers', ...tiers]);
  populateSelect('#clubFilter', ['All Clubs', ...clubs], formatClubName);
}

// Fill a dropdown with values
function populateSelect(selector, values, labelFormatter = d => d) {
  const select = d3.select(selector);

  select.selectAll('option')
    .data(values)
    .join('option')
    .attr('value', d => d)
    .text(d => labelFormatter(d));
}

// This function redraws everything based on current filters
function renderAll(data) {
  // Filter movement data by month
  const filteredFlowGeo = state.selectedMonth === 'All Months'
    ? data.flowsGeo
    : data.flowsGeo.filter(d => d.flow_month === state.selectedMonth);

  // Filter member data by tier and home club
  const filteredMembers = data.memberMetrics.filter(d =>
    (state.selectedTier === 'All Tiers' || d.membership_tier === state.selectedTier) &&
    (state.selectedClub === 'All Clubs' || d.home_club === state.selectedClub)
  );

  // Draw all charts and update insights
  renderMovementMap(filteredFlowGeo);
  renderParallelPlot(filteredMembers, data.memberMetrics);
  renderStreamgraph(data.streamData);
  updateInsights(filteredFlowGeo, filteredMembers, data.streamData);
}

// Draw the member movement map
function renderMovementMap(data) {
  const container = d3.select('#movementMap');
  container.selectAll('*').remove();

  // If there is no data, show a message
  if (!data.length) {
    container.append('div').attr('class', 'empty-state').text('No movement data for this filter.');
    return;
  }

  const width = 1180;
  const height = 420;
  const margin = { top: 24, right: 30, bottom: 30, left: 30 };
  const svg = container.append('svg').attr('viewBox', `0 0 ${width} ${height}`);

  // Make a map of clubs and their coordinates
  const clubsMap = new Map();
  data.forEach(d => {
    clubsMap.set(d.origin_club, { club: d.origin_club, lat: d.origin_lat, lon: d.origin_lon });
    clubsMap.set(d.destination_club, { club: d.destination_club, lat: d.dest_lat, lon: d.dest_lon });
  });

  const clubs = Array.from(clubsMap.values());

  // Create x and y scales for club positions
  const x = d3.scaleLinear()
    .domain(d3.extent(clubs, d => d.lon))
    .range([margin.left + 30, width - margin.right - 30]);

  const y = d3.scaleLinear()
    .domain(d3.extent(clubs, d => d.lat))
    .range([height - margin.bottom - 10, margin.top + 10]);

  // Add background box
  svg.append('rect')
    .attr('x', margin.left)
    .attr('y', margin.top)
    .attr('width', width - margin.left - margin.right)
    .attr('height', height - margin.top - margin.bottom)
    .attr('rx', 18)
    .attr('fill', '#f8fbff')
    .attr('stroke', '#d9e6f2');

  // Keep only top 10 movement flows to avoid clutter
  const topFlows = d3.sort(data, d => -d.flow_count).slice(0, 10);

  // Make line thickness depend on flow volume
  const flowScale = d3.scaleSqrt()
    .domain(d3.extent(topFlows, d => d.flow_count))
    .range([1.5, 10]);

  // Create curved line path between clubs
  const arcPath = d => {
    const x1 = x(d.origin_lon);
    const y1 = y(d.origin_lat);
    const x2 = x(d.dest_lon);
    const y2 = y(d.dest_lat);
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2 - Math.max(20, Math.abs(x2 - x1) * 0.15);
    return `M ${x1},${y1} Q ${mx},${my} ${x2},${y2}`;
  };

  // Draw movement lines
  svg.append('g')
    .selectAll('path')
    .data(topFlows)
    .join('path')
    .attr('d', arcPath)
    .attr('fill', 'none')
    .attr('stroke', colors.primary)
    .attr('stroke-opacity', 0.35)
    .attr('stroke-width', d => flowScale(d.flow_count))
    .on('mousemove', (event, d) => {
      d3.select(event.currentTarget).attr('stroke-opacity', 0.9);
      showTooltip(
        event,
        `<strong>${formatClubName(d.origin_club)} → ${formatClubName(d.destination_club)}</strong><br>Flow count: ${numberFmt(d.flow_count)}`
      );
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).attr('stroke-opacity', 0.35);
      hideTooltip();
    });

  // Draw club dots
  svg.append('g')
    .selectAll('circle')
    .data(clubs)
    .join('circle')
    .attr('cx', d => x(d.lon))
    .attr('cy', d => y(d.lat))
    .attr('r', 7)
    .attr('fill', colors.teal)
    .attr('stroke', '#fff')
    .attr('stroke-width', 2)
    .on('mousemove', (event, d) => {
      showTooltip(event, `<strong>${formatClubName(d.club)}</strong>`);
    })
    .on('mouseleave', hideTooltip);

  // Add club names next to dots
  svg.append('g')
    .selectAll('text')
    .data(clubs)
    .join('text')
    .attr('x', d => x(d.lon) + 10)
    .attr('y', d => y(d.lat) - 10)
    .attr('class', 'axis-label')
    .text(d => formatClubName(d.club));

  // Add note under the chart
  svg.append('text')
    .attr('x', margin.left + 10)
    .attr('y', height - 8)
    .attr('class', 'note-text')
    .text('Showing the top 10 club-to-club movement flows.');
}

// Draw the parallel coordinates chart
function renderParallelPlot(data, baseData) {
  const container = d3.select('#parallelPlot');
  container.selectAll('*').remove();

  // If no data matches the filters, show message
  if (!data.length) {
    container.append('div').attr('class', 'empty-state').text('No members match the current filters.');
    return;
  }

  const width = 700;
  const height = 440;
  const margin = { top: 28, right: 20, bottom: 20, left: 20 };
  const svg = container.append('svg').attr('viewBox', `0 0 ${width} ${height}`);

  // These are the member variables shown in the chart
  const dimensions = [
    { key: 'age', label: 'Age' },
    { key: 'monthly_fee', label: 'Monthly Fee' },
    { key: 'total_checkins', label: 'Check-ins' },
    { key: 'avg_app_login_minutes', label: 'App Minutes' },
    { key: 'unique_clubs', label: 'Unique Clubs' },
    { key: 'total_sales', label: 'Total Sales' }
  ];

  // Make a y-scale for each axis
  const y = {};
  dimensions.forEach(dim => {
    y[dim.key] = d3.scaleLinear()
      .domain(d3.extent(baseData, d => d[dim.key]))
      .nice()
      .range([height - margin.bottom - 34, margin.top + 22]);
  });

  // Set x positions for each axis
  const x = d3.scalePoint()
    .domain(dimensions.map(d => d.key))
    .range([margin.left + 40, width - margin.right - 20]);

  // Color lines by membership tier
  const color = d3.scaleOrdinal()
    .domain(['Bronze', 'Silver', 'Gold', 'Platinum'])
    .range(['#94a3b8', '#2563eb', '#f59e0b', '#8b5cf6']);

  // Create line path across all axes
  const path = d => d3.line()(dimensions.map(dim => [x(dim.key), y[dim.key](d[dim.key])]));

  // Draw member lines
  svg.append('g')
    .selectAll('path')
    .data(data.slice(0, 300))
    .join('path')
    .attr('d', path)
    .attr('fill', 'none')
    .attr('stroke', d => color(d.membership_tier))
    .attr('stroke-opacity', 0.18)
    .attr('stroke-width', 1.2)
    .on('mousemove', (event, d) => {
      d3.select(event.currentTarget)
        .attr('stroke-opacity', 0.95)
        .attr('stroke-width', 2.5);

      showTooltip(
        event,
        `<strong>${d.member_id}</strong><br>${d.membership_tier} member<br>Home club: ${formatClubName(d.home_club)}<br>Check-ins: ${numberFmt(d.total_checkins)}<br>Total sales: ${moneyFmt(d.total_sales)}`
      );
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget)
        .attr('stroke-opacity', 0.18)
        .attr('stroke-width', 1.2);
      hideTooltip();
    });

  // Draw each vertical axis
  const axis = svg.selectAll('.dimension')
    .data(dimensions)
    .join('g')
    .attr('class', 'dimension')
    .attr('transform', d => `translate(${x(d.key)},0)`);

  axis.each(function (dim) {
    d3.select(this).call(d3.axisLeft(y[dim.key]).ticks(5));
  });

  // Add axis titles
  axis.append('text')
    .attr('class', 'axis-label')
    .attr('text-anchor', 'middle')
    .attr('y', 16)
    .style('font-weight', 700)
    .text(d => d.label);

  // Add note under chart
  svg.append('text')
    .attr('x', margin.left)
    .attr('y', height - 6)
    .attr('class', 'note-text')
    .text(`Showing ${numberFmt(Math.min(data.length, 300))} member lines for readability.`);

  // Add legend for membership tiers
  const legend = svg.append('g').attr('transform', `translate(${width - 150}, 20)`);
  ['Bronze', 'Silver', 'Gold', 'Platinum'].forEach((tier, i) => {
    const g = legend.append('g').attr('transform', `translate(0, ${i * 18})`);
    g.append('circle').attr('r', 5).attr('fill', color(tier));
    g.append('text').attr('x', 12).attr('y', 4).attr('class', 'axis-label').text(tier);
  });
}

// Draw the streamgraph
function renderStreamgraph(data) {
  const container = d3.select('#streamgraph');
  container.selectAll('*').remove();

  // If no data is there, show a message
  if (!data.length) {
    container.append('div').attr('class', 'empty-state').text('No class trend data available.');
    return;
  }

  const width = 700;
  const height = 440;
  const margin = { top: 30, right: 150, bottom: 44, left: 50 };
  const svg = container.append('svg').attr('viewBox', `0 0 ${width} ${height}`);

  // Find all class category names
  const keys = Object.keys(data[0]).filter(key => !['checkin_month', 'date'].includes(key));

  // Find total participation for each class
  const totals = keys.map(key => ({
    key,
    total: d3.sum(data, d => d[key])
  }));

  // Keep top 5 class categories only
  const topKeys = totals
    .sort((a, b) => d3.descending(a.total, b.total))
    .slice(0, 5)
    .map(d => d.key);

  // Stack the data for the streamgraph
  const stacked = d3.stack()
    .keys(topKeys)
    .offset(d3.stackOffsetWiggle)
    .order(d3.stackOrderInsideOut)(data);

  // Time scale on x-axis
  const x = d3.scaleTime()
    .domain(d3.extent(data, d => d.date))
    .range([margin.left, width - margin.right]);

  // Height scale on y-axis
  const y = d3.scaleLinear()
    .domain([
      d3.min(stacked, layer => d3.min(layer, d => d[0])),
      d3.max(stacked, layer => d3.max(layer, d => d[1]))
    ])
    .range([height - margin.bottom, margin.top]);

  // Colors for each class category
  const color = d3.scaleOrdinal()
    .domain(topKeys)
    .range(['#2563eb', '#14b8a6', '#8b5cf6', '#f59e0b', '#ef4444']);

  // Create smooth streamgraph shape
  const area = d3.area()
    .x(d => x(d.data.date))
    .y0(d => y(d[0]))
    .y1(d => y(d[1]))
    .curve(d3.curveCatmullRom.alpha(0.5));

  // Draw stream layers
  svg.append('g')
    .selectAll('path')
    .data(stacked)
    .join('path')
    .attr('d', area)
    .attr('fill', d => color(d.key))
    .attr('fill-opacity', 0.86)
    .on('mousemove', (event, layer) => {
      const [mx] = d3.pointer(event);
      const hoveredDate = x.invert(mx);

      // Find nearest month to mouse position
      const nearest = data.reduce((best, current) =>
        Math.abs(current.date - hoveredDate) < Math.abs(best.date - hoveredDate) ? current : best
      );

      d3.select(event.currentTarget).attr('fill-opacity', 1);

      showTooltip(
        event,
        `<strong>${layer.key}</strong><br>${monthFmt(nearest.date)}<br>Participants: ${numberFmt(nearest[layer.key])}`
      );
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).attr('fill-opacity', 0.86);
      hideTooltip();
    });

  // Draw bottom time axis
  svg.append('g')
    .attr('transform', `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(6).tickFormat(monthFmt));

  // Add legend on the right
  const legend = svg.append('g').attr('transform', `translate(${width - margin.right + 20}, ${margin.top})`);
  topKeys.forEach((key, i) => {
    const row = legend.append('g').attr('transform', `translate(0, ${i * 24})`);
    row.append('rect').attr('width', 14).attr('height', 14).attr('rx', 4).attr('fill', color(key));
    row.append('text').attr('x', 22).attr('y', 11).attr('class', 'axis-label').text(key);
  });

  // Add short note
  svg.append('text')
    .attr('x', margin.left)
    .attr('y', 18)
    .attr('class', 'note-text')
    .text('Top 5 class categories shown for readability.');
}

// Update the 3 insight boxes above the charts
function updateInsights(flowData, memberData, streamData) {
  // Find which club gets the most incoming movement
  if (flowData.length) {
    const destinations = d3.rollup(
      flowData,
      v => d3.sum(v, d => d.flow_count),
      d => d.destination_club
    );

    const topHub = Array.from(destinations, ([club, total]) => ({ club, total }))
      .sort((a, b) => d3.descending(a.total, b.total))[0];

    d3.select('#hubInsight').text(
      `${formatClubName(topHub.club)} attracts the highest inbound movement (${numberFmt(topHub.total)} flows), making it the clearest movement hub.`
    );
  }

  // Find which membership tier has the strongest average value
  if (memberData.length) {
    const avgTier = d3.rollups(
      memberData,
      v => ({
        checkins: d3.mean(v, d => d.total_checkins),
        clubs: d3.mean(v, d => d.unique_clubs),
        sales: d3.mean(v, d => d.total_sales)
      }),
      d => d.membership_tier
    ).sort((a, b) => d3.descending(a[1].sales, b[1].sales))[0];

    d3.select('#segmentInsight').text(
      `${avgTier[0]} members show the strongest value in the current filter, with high average sales and broad club usage.`
    );
  } else {
    d3.select('#segmentInsight').text('No members match the selected filters.');
  }

  // Find which class has highest total participation
  if (streamData.length) {
    const keys = Object.keys(streamData[0]).filter(key => !['checkin_month', 'date'].includes(key));
    const totals = keys.map(key => ({
      key,
      total: d3.sum(streamData, d => d[key])
    })).sort((a, b) => d3.descending(a.total, b.total));

    d3.select('#trendInsight').text(
      `${totals[0].key} leads total participation across the period, while class preferences shift over time.`
    );
  }
}

// This changes club names like NYC_Downtown into NYC Downtown
function formatClubName(name) {
  return name ? name.replaceAll('_', ' ') : '';
}

// Show tooltip near the mouse
function showTooltip(event, html) {
  tooltip
    .classed('hidden', false)
    .html(html)
    .style('left', `${event.clientX + 16}px`)
    .style('top', `${event.clientY + 16}px`);
}

// Hide tooltip when mouse leaves
function hideTooltip() {
  tooltip.classed('hidden', true);
}