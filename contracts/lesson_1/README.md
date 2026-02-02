# Lesson One: NFT Upgrade Tutorial

This lesson demonstrates how to create a Rookie NFT and upgrade it to a Member NFT through a series of steps.

## Prerequisites

- Sui CLI installed
- Basic understanding of Sui Move

## Contract Overview

The smart contract implements a simple NFT upgrade system where:
1. Users can create a Rookie NFT
2. Rookies can be upgraded to Member NFTs after meeting certain conditions

## Steps to Complete the Lesson

### 1. Create a Rookie NFT

Create your first Rookie NFT using the following command:

```bash
sui client call --package <PACKAGE_ID> --module lesson_one --function new_member --args "your_name"
```

Example:
```bash
sui client call --package 0xd1f32dfb749c3008c4078c4824dde1a8944b5bd75e62852c717e261304572ff7 --module lesson_one --function new_member --args jarekkkkk
```

### 2. Prepare Your Rookie NFT for Upgrade

To upgrade your Rookie NFT to a Member NFT, you need to meet the following conditions:
1. Update the image URL (must not be empty)
2. Have your NFT signed by a different address
3. The original creator must perform the upgrade

Follow these steps:

a. Update the image URL:
```bash
sui client call --package <PACKAGE_ID> --module lesson_one --function update_img_url --args <ROOKIE_NFT_ID> "your_image_url"
```

b. Get a different address to sign your NFT:
```bash
sui client call --package <PACKAGE_ID> --module lesson_one --function update_with_different_signer --args <ROOKIE_NFT_ID>
```
Note: This must be called from a different address than the creator's address.

### 3. Upgrade to Member NFT

Once all conditions are met, the original creator can upgrade the Rookie NFT:
```bash
sui client call --package <PACKAGE_ID> --module lesson_one --function upgrade --args <ROOKIE_NFT_ID> <CLOCK_OBJECT_ID>
```

## Upgrade Requirements

To successfully upgrade a Rookie NFT to a Member NFT, ensure:
- The NFT has a non-empty image URL
- The NFT has been signed by a different address
- The NFT has a non-empty name
- The upgrade is performed by the original creator

## Events

When successfully upgraded, the contract emits a `MemberRegisterEvent` containing:
- Member ID
- Name
- Image URL
- Timestamp

## Error Codes

- `EIsOwner (100)`: Triggered when trying to sign your own NFT
- `ENotUpgradeable (101)`: Triggered when upgrade requirements are not met
