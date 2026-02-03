Transaction transaction = card.authorize(authorizeData.getAmount())
        .withEcommerceInfo(ecom)
        .withCurrency(authorizeData.getCurrency())
        .withAddress(address)
        .withAvs(authorizeData.getIsAvs())
        .withAllowDuplicates(true)
        .withCardBrandStorage(StoredCredentialInitiator.CardHolder)
        .withRequestMultiUseToken(true)
        .execute();