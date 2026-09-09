/**
 * StudyHub - Pricing page API integration
 */

document.addEventListener('DOMContentLoaded', () => {
  const plansContainer = document.getElementById('pricing-plans');
  if (!plansContainer) return;
  const comparisonHeaders = document.getElementById('comparison-plan-headers');
  const comparisonRows = document.getElementById('comparison-plan-rows');

  const formatPrice = (price) => Number(price).toLocaleString('en-IN');
  const planType = (plan) => plan.type === 'full_day' ? 'full-day' : plan.type === 'half_day' ? 'half-day' : 'slot';
  const planLabel = (plan) => plan.type === 'full_day' ? 'Full Day' : plan.type === 'half_day' ? 'Half Day' : 'Slot';

  const createPlanCard = (plan, index) => {
    const type = planType(plan);
    const label = planLabel(plan);
    const card = document.createElement('article');
    card.className = `pricing-card${plan.type === 'full_day' ? ' featured' : ''}`;

    if (plan.type === 'full_day') {
      const badge = document.createElement('div');
      badge.className = 'pricing-badge';
      badge.textContent = 'All-Day Immersion';
      card.appendChild(badge);
    }

    const title = document.createElement('h3');
    title.className = 'pricing-card-title';
    title.textContent = `${index + 1}. ${plan.name}`;
    card.appendChild(title);

    const description = document.createElement('p');
    description.className = 'pricing-card-desc';
    description.textContent = plan.description || 'A flexible membership plan for your study routine.';
    card.appendChild(description);

    const timing = document.createElement('div');
    timing.className = 'pricing-timing-tag';
    timing.innerHTML = '<i class="fa-regular fa-clock"></i>';
    timing.append(` ${plan.slot_label || 'Flexible access hours'}`);
    card.appendChild(timing);

    const price = document.createElement('div');
    price.className = 'pricing-price';
    price.innerHTML = '<span class="pricing-currency">₹</span>';
    const amount = document.createElement('span');
    amount.className = 'pricing-amount';
    amount.textContent = formatPrice(plan.price);
    price.appendChild(amount);
    const period = document.createElement('span');
    period.className = 'pricing-period';
    period.textContent = ' / month';
    price.appendChild(period);
    card.appendChild(price);

    const duration = document.createElement('div');
    duration.style.cssText = 'font-size: 0.85rem; color: var(--text-subtle); margin-bottom: 1.25rem;';
    duration.innerHTML = '<i class="fa-solid fa-calendar-days"></i>';
    duration.append(` Duration: ${plan.duration_days} Calendar Days`);
    card.appendChild(duration);

    const features = document.createElement('ul');
    features.className = 'pricing-features';
    (Array.isArray(plan.features) ? plan.features : []).forEach((feature) => {
      const item = document.createElement('li');
      item.innerHTML = '<i class="fa-solid fa-check"></i>';
      item.append(` ${feature}`);
      features.appendChild(item);
    });
    card.appendChild(features);

    const link = document.createElement('a');
    link.className = `btn ${plan.type === 'full_day' ? 'btn-primary' : 'btn-outline'} btn-full btn-lg`;
    link.href = `seats.html?plan=${encodeURIComponent(type)}`;
    link.innerHTML = '<i class="fa-solid fa-chair"></i>';
    link.append(` Select ${label} Seat`);
    card.appendChild(link);

    return card;
  };

  const renderComparison = (plans) => {
    if (!comparisonHeaders || !comparisonRows) return;
    comparisonHeaders.removeAttribute('colspan');
    comparisonHeaders.replaceChildren();
    comparisonRows.replaceChildren();

    plans.forEach((plan) => {
      const header = document.createElement('th');
      header.className = plan.type === 'full_day' ? 'col-highlight' : '';
      header.style.width = `${66 / plans.length}%`;
      header.textContent = plan.name;
      comparisonHeaders.appendChild(header);
    });

    const features = [...new Set(plans.flatMap((plan) => Array.isArray(plan.features) ? plan.features : []))];
    features.forEach((feature) => {
      const row = document.createElement('tr');
      const nameCell = document.createElement('td');
      const featureName = document.createElement('strong');
      featureName.textContent = feature;
      nameCell.appendChild(featureName);
      row.appendChild(nameCell);

      plans.forEach((plan) => {
        const cell = document.createElement('td');
        if (Array.isArray(plan.features) && plan.features.includes(feature)) {
          cell.className = plan.type === 'full_day' ? 'col-highlight' : '';
          cell.innerHTML = '<span class="table-check"><i class="fa-solid fa-check"></i> Included</span>';
        } else {
          cell.innerHTML = '<span class="table-cross"><i class="fa-solid fa-minus"></i> Not included</span>';
        }
        row.appendChild(cell);
      });
      comparisonRows.appendChild(row);
    });
  };

  const showMessage = (message, isError = false) => {
    plansContainer.replaceChildren();
    const status = document.createElement('p');
    status.className = 'pricing-status';
    status.role = 'status';
    status.textContent = message;
    if (isError) status.classList.add('pricing-status-error');
    plansContainer.appendChild(status);
  };

  fetch('/api/plans')
    .then((response) => {
      if (!response.ok) throw new Error(`Plans request failed with status ${response.status}`);
      return response.json();
    })
    .then((payload) => {
      if (!payload.success || !Array.isArray(payload.data)) {
        throw new Error('The plans response was invalid.');
      }
      if (payload.data.length === 0) {
        showMessage('No membership plans are currently available. Please check back soon.');
        if (comparisonRows) comparisonRows.replaceChildren();
        if (comparisonHeaders) comparisonHeaders.textContent = 'No plans available';
        return;
        }
        renderComparison(payload.data);
        plansContainer.replaceChildren(...payload.data.map(createPlanCard));
    })
    .catch((error) => {
      console.error('Unable to load membership plans:', error);
      showMessage('We could not load membership plans right now. Please refresh the page or try again later.', true);
    });
});
