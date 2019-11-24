const{ ApiPromise, WsProvider } = require('@polkadot/api');
const { isHex } = require('@polkadot/util');
const DOT_DECIMAL_PLACES = 1_000_000_000_000;

let display_nominators = true;
const provider = new WsProvider('wss://kusama-rpc.polkadot.io/');

function formatWithCommas(num) {
	return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
}

async function main(){
	
	const api = await ApiPromise.create({ provider });

	const [ currentValidators, totalIssuance ] = await Promise.all([
		api.query.session.validators(),
		api.query.balances.totalIssuance()
	]);

	const totalKSM = parseInt(totalIssuance.toString());
	let totalBondingStake = 0;
	let stakes = [];

	for (let i=0; i<currentValidators.length; i++) {
		const validatorTotalStake = await api.query.staking.stakers(currentValidators[i]);
		const validatorCommissionRate = await api.query.staking.validators(currentValidators[i]);

		let self_stake = (validatorTotalStake['own'].toString() / DOT_DECIMAL_PLACES).toFixed(2);
		let commission = (validatorCommissionRate[0]['validatorPayment'] / DOT_DECIMAL_PLACES).toFixed(2);

		console.log(`Stash Address: ${currentValidators[i].toString()}`);
		console.log(`Self Stake: ${formatWithCommas(self_stake)} KSM`);
		console.log(`Commission: ${formatWithCommas(commission)} KSM`);
		console.log(`Nominators: ${validatorTotalStake['others'].length}\n`);

		// @ts-ignore
		if (display_nominators === true) {
			console.log(`Nominators`);
			for (let j=0; j<validatorTotalStake['others'].length; j++) {
				let nominator_stake = (validatorTotalStake['others'][j]['value'] / DOT_DECIMAL_PLACES).toFixed(2);
				console.log(`Address: ${validatorTotalStake['others'][j]['who']}, ` +
					`Stake: ${formatWithCommas(nominator_stake)}`
				);
			}
			console.log(` `);
		}

		let val_total_stake = (validatorTotalStake['total'] / DOT_DECIMAL_PLACES).toFixed(2);

		console.log(`Validator total stake: ${formatWithCommas(val_total_stake)} KSM\n`);
		stakes.push(validatorTotalStake['total'] / DOT_DECIMAL_PLACES);
		totalBondingStake += parseInt(validatorTotalStake['total']);

		console.log("#########################################################################\n");
	}

	let total_ksm = (totalKSM / DOT_DECIMAL_PLACES).toFixed(0);
	let bonding_stake = (totalBondingStake / DOT_DECIMAL_PLACES).toFixed(0);
	let staking_rate = (totalBondingStake / totalKSM * 100).toFixed(1);
	let minimum_stake = (Math.min.apply(null, stakes)).toFixed(2);

	console.log(`Total Issuance: ${formatWithCommas(total_ksm)} KSM`);
	console.log(`Bonding Stake:  ${formatWithCommas(bonding_stake)} KSM`);
	console.log(`Staking Rate:   ${staking_rate} %`);
	console.log(`Validators:     ${currentValidators.length}`);
	console.log(`Minimum Stake:  ${formatWithCommas(minimum_stake)}\n`);

	process.exit(0);
}

main()
