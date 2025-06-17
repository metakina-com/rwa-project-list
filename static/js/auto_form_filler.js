class AutoFormFiller {
    constructor() {
        this.generatedPlan = null;
    }

    async fillTokenizationForm(tokenizationPlan) {
        // 自动填充NFT发行表单
        this.fillNFTForm(tokenizationPlan.nftPlan);
        
        // 自动填充代币发行表单
        this.fillTokenForm(tokenizationPlan.tokenPlan);
        
        // 自动填充分配方案表单
        this.fillDistributionForm(tokenizationPlan.distributionPlan);
        
        // 显示可编辑的表单
        this.showEditableForm();
    }

    fillNFTForm(nftPlan) {
        // 填充NFT相关字段
        nftPlan.collections.forEach((collection, index) => {
            const container = document.getElementById(`nft-collection-${index}`) || 
                            this.createNFTCollectionForm(index);
            
            container.querySelector('[name="nftType"]').value = collection.type;
            container.querySelector('[name="nftName"]').value = collection.name;
            container.querySelector('[name="nftSupply"]').value = collection.supply;
            container.querySelector('[name="nftPrice"]').value = collection.price;
            container.querySelector('[name="nftDescription"]').value = collection.description;
            
            // 设置权利选项
            collection.rights.forEach(right => {
                const checkbox = container.querySelector(`[value="${right}"]`);
                if (checkbox) checkbox.checked = true;
            });
        });
    }

    fillTokenForm(tokenPlan) {
        // 填充代币相关字段
        document.getElementById('tokenName').value = tokenPlan.tokenName;
        document.getElementById('tokenSymbol').value = tokenPlan.tokenSymbol;
        document.getElementById('totalSupply').value = tokenPlan.totalSupply;
        document.getElementById('initialPrice').value = tokenPlan.initialPrice;
        document.getElementById('vestingPeriod').value = tokenPlan.vestingPeriod;
        document.getElementById('stakingRewards').value = tokenPlan.stakingRewards;
        
        // 填充治理参数
        document.getElementById('votingPower').value = tokenPlan.governance.votingPower;
        document.getElementById('proposalThreshold').value = tokenPlan.governance.proposalThreshold;
        document.getElementById('quorum').value = tokenPlan.governance.quorum;
    }

    showEditableForm() {
        // 显示可编辑的表单界面
        const formContainer = document.getElementById('editableTokenizationForm');
        formContainer.style.display = 'block';
        
        // 添加编辑提示
        this.showEditingInstructions();
    }

    showEditingInstructions() {
        const instructions = document.createElement('div');
        instructions.className = 'editing-instructions';
        instructions.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i>
                <strong>方案已自动生成</strong><br>
                系统已根据您的项目信息自动生成NFT和代币发行方案。
                您可以根据需要调整以下参数，然后提交审核。
            </div>
        `;
        
        document.getElementById('editableTokenizationForm').prepend(instructions);
    }
}